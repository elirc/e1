# Reason from state and boundary predicates

Part one gives a reference solution for each exercise in [05-PRACTICE](05-PRACTICE.md). Every test below was run against the code as committed, from the repo root, with no `node_modules`, and all six passed. Part two is a senior-reviewer pass over what the fix pass left behind.

## Part one: solutions

All tests assume the fixture from the top of 05.

### Exercise 1

```ts
test("ex1: every rejection maps to the documented status", () => {
  const f = fixture();
  const { booking } = f.service.create(f.input);
  assert.throws(() => f.service.cancel("book_missing", "x", "t"), status(404));
  assert.throws(() => f.service.cancel(booking.id, "x", "wrong-token"), status(403));
  assert.throws(() => f.service.cancel(booking.id, "   ", booking.confirmationToken), status(400));
  f.service.cancel(booking.id, "done", booking.confirmationToken);
  assert.throws(() => f.service.confirm(booking.id, booking.confirmationToken), status(409));
});
```

Order matters inside `cancel` (`booking-service.ts:93-100`): `authorize` runs before `required(reason, ...)`, so a blank reason with a *wrong* token is 403, not 400. Only the 409 case reaches `transition`, and it is caught by the `canTransitionBooking` pre-check (`:56`) rather than by `transitionBooking`'s plain `Error`.

### Exercise 2

```ts
test("ex2: a leading buffer on the second event type blocks 10:30 but not 11:00", () => {
  const f = fixture();
  f.other.bufferBeforeMinutes = 30;
  f.service.create(f.input); // first event 10:00-10:30, no buffers
  assert.throws(() => f.service.create({ ...f.input, eventTypeId: f.other.id, startTime: "2026-09-21T10:30:00Z" }), status(409));
  const ok = f.service.create({ ...f.input, eventTypeId: f.other.id, startTime: "2026-09-21T11:00:00Z" });
  assert.equal(ok.booking.startTime, "2026-09-21T11:00:00.000Z");
});
```

The 10:30 candidate occupies 10:00-11:00 once its own leading buffer is added, which overlaps the 10:00-10:30 blocker. The 11:00 candidate occupies 10:30-11:30 and only touches it. The returned `startTime` has milliseconds because the slot comes from `toISOString()` (`availability.ts:162`), not from your input string.

### Exercise 3

```ts
test("ex3: an async callback is rejected and its draft is never published", async () => {
  const f = fixture();
  f.service.create(f.input);
  assert.throws(() => f.repository.transaction(async draft => { draft.bookings.length = 0; }), /synchronous/);
  assert.equal(f.repository.read().bookings.length, 1);
});
```

The guard cannot stop the callback from running — the draft *was* emptied — but `state = structuredClone(draft)` on line 19 is never reached. Rollback here is "never publish", not "undo".

### Exercise 4

```ts
test("ex4: the unauthenticated upcoming list leaks the guest token that guards cancel", () => {
  bookingRepository.reset();
  try {
    const leaked = listUpcomingBookings().find(b => b.guestCanCancel && b.status === "confirmed")!;
    assert.ok(leaked.confirmationToken, "token is present in the dashboard projection");
    const canceled = cancelBooking(leaked.id, "not the guest", leaked.confirmationToken);
    assert.equal(canceled.status, "canceled");
  } finally { bookingRepository.reset(); }
});
```

See review finding 1.

### Exercise 5

```ts
test("ex5: rescheduling a pending booking produces a confirmed replacement", () => {
  const f = fixture();
  const { booking } = f.service.create(f.input);
  f.repository.transaction(state => { state.bookings[0].status = "pending"; });
  const { replacement } = f.service.reschedule(booking.id, "2026-09-21T11:00:00Z", booking.confirmationToken);
  assert.equal(replacement.status, "confirmed");
});
```

See review finding 3.

### Exercise 6

```ts
test("ex6: rate-limit buckets are keyed by a caller-supplied header", () => {
  const key = (ip: string) => `create-booking:${ip}`;
  for (let i = 0; i < 12; i += 1) assert.equal(rateLimit(key("203.0.113.9"), 12, 60_000).allowed, true);
  assert.equal(rateLimit(key("203.0.113.9"), 12, 60_000).allowed, false);
  assert.equal(rateLimit(key("203.0.113.9, spoofed"), 12, 60_000).allowed, true);
});
```

See review finding 4.

### Exercise 7

A reasonable answer: keep the `Booking` model from `prisma/schema.prisma` but add a generated `occupied tstzrange` column (start minus the event's leading buffer to end plus its trailing buffer) and a Postgres `EXCLUDE USING gist (organizerId WITH =, occupied WITH &&) WHERE (status IN ('pending','confirmed') AND deletedAt IS NULL)` constraint. The schema today has only an `@@index([organizerId, startTime])`, which speeds the conflict query but does not prevent two writers from both passing it. With the constraint, `READ COMMITTED` is enough: the second insert fails with an exclusion violation, which maps to the same 409 that `offered` returns today. Reschedule becomes one database transaction (update predecessor, insert replacement, insert attendees). Provider calendar writes go to an outbox row written in that same transaction and are delivered by a worker with retries, so a provider outage delays sync instead of rolling back a booking the guest already saw confirmed. Keep `generateSlots` for *offering* slots; the constraint is the authority on *taking* one.

## Part two: senior review

Each finding was checked by reading the cited lines; findings 1-4 are also demonstrated by the passing tests above, and findings 2 and 6 by a throwaway test run the same way.

### 1. Guest tokens are readable by anyone (high)

The whole authority model in `authorize` (`booking-service.ts:46-54`) rests on `confirmationToken` being known only to the guest. But:

- `GET /api/dashboard/upcoming` and `GET /api/dashboard/past` return full `Booking` objects including `confirmationToken` (`src/app/api/dashboard/upcoming/route.ts:5-7`, `past/route.ts`, via `getDashboardSnapshot` at `src/lib/demo-data.ts:497-530`).
- `GET /api/dashboard/bookings/[bookingId]` returns the same via `getBookingDetail` (`src/lib/mock-services.ts:145-160`).
- The dashboard detail page prints it: `` `Guest token: ${detail.booking.confirmationToken}` `` (`src/app/dashboard/bookings/[bookingId]/page.tsx:41`).

None of these is behind any authentication (`src/app/dashboard/layout.tsx` just returns `children`; `src/proxy.ts` only adds a correlation ID). Exercise 4 turns this into a working cancel of another person's booking. **Fix:** introduce owner-facing projections that omit the token (`Omit<Booking, "confirmationToken">`) for every dashboard read, and put owner routes behind real authentication. Then invert exercise 4 into a regression test that asserts the token is absent.

### 2. "Upcoming" includes canceled bookings (medium)

`getDashboardSnapshot` splits upcoming and past by `startTime` only (`demo-data.ts:499-505`); there is no status filter. The dashboard card labels the count "Bookings in active or pending states" (`src/app/dashboard/page.tsx:23-26`). A throwaway test canceled a seeded upcoming booking and confirmed the upcoming count did not change and the entry now had `status: "canceled"`. The integration test at `booking-flow.test.ts:35` asserts membership *before* cancel but never after, which is why this was not caught. **Fix:** filter with `isBlockingBookingStatus` for the metric, or rename the card.

### 3. Reschedule hard-codes `confirmed` and inherits guest flags (medium, product decision)

`booking-service.ts:108` sets `status: "confirmed"` regardless of the source's status, so a booking awaiting host approval becomes confirmed by moving it. The spread `{ ...booking, ... }` also carries `guestCanCancel`/`guestCanReschedule` forward, so a host who disabled guest rescheduling on one booking keeps that on the replacement — probably intended, but nothing tests it. **Fix:** decide the rule (most schedulers keep `pending`), encode it as `status: booking.status`, and add a test for both flags.

### 4. Rate limiting is advisory only (medium)

- The key is the raw `x-forwarded-for` header (`src/app/api/bookings/route.ts:8-9`, `preview/route.ts:7-8`). Any client can send a new value per request. Behind a trusted proxy you would take the *last* hop added by your own proxy, not the whole string.
- `buckets` (`src/lib/rate-limit.ts:1`) is never pruned. An expired bucket is replaced only when the *same* key returns (`:7-9`), so spoofed keys accumulate forever — a slow memory leak an attacker can accelerate.
- It is per process, like the repository.

### 5. Preview and booking disagree on templates (low)

`getPublicBookingPage` picks the organizer's template without checking `deletedAt` (`demo-data.ts:547-549`), while the service's `offered` requires `!item.deletedAt` (`booking-service.ts:37`). A soft-deleted template would keep showing slots on the public page that `create` then rejects with "No availability configured." One shared `templateFor(organizerId)` helper removes the drift.

### 6. Canned mutators look successful (low, but misleading)

`PATCH /api/event-types/[eventTypeId]` calls `updateEventType`, which falls back to the *first* event type when the ID is unknown (`mock-services.ts:90-97`) and returns 200 with that event's ID. A throwaway test confirmed `updateEventType("does-not-exist", ...)` returns `evt_strategy_sync`. `DELETE` on the same route returns a `deletedAt` without deleting anything. These should return 404 / 501 rather than fabricate success.

### 7. Smaller notes

- `confirm` samples the clock twice (`booking-service.ts:86` and `:88`) while `reschedule` deliberately samples once (`:105`). Harmless today; inconsistent with the stated rule.
- `confirm` re-runs `offered` with the notice check, so a `pending` booking cannot be confirmed once it is inside `minNoticeMinutes`. That may be the desired rule, but it is undocumented and untested.
- `generateSlots` rebuilds the blocker list inside the per-day loop (`availability.ts:143-152`) and generates every slot in the horizon before slicing to 24 (`:171-173`). Fine for seed data; O(days x bookings) work per public page view at scale.
- `respond` echoes a client-supplied `x-correlation-id` without validating it (`src/lib/http.ts:9-10`), which lets callers inject arbitrary strings into logs that key on it.

### Test gaps worth closing

- No test asserts any read surface *omits* the token (finding 1).
- No test covers dashboard counts after a status change (finding 2).
- No test for the rate limiter at all.
- No daylight-saving case: every fixture uses `timezone: "UTC"`, so `zonedDateTimeToUtc` (`src/lib/time.ts:97`) is never exercised across a transition.
- The only HTTP-level test needs `next` installed; route-to-status mapping is otherwise untested on a bare clone.

### What to look for in future changes

Accidental direct access to seed arrays instead of the repository; service defaults that invent required values; token checks performed after mutation; a reschedule that reuses the old token; any new read path that returns a raw `Booking`.

## Source excerpt

From [src/lib/booking-state.ts](../src/lib/booking-state.ts) (lines 3-21).

```ts
const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  draft: ["pending", "confirmed", "canceled"],
  pending: ["confirmed", "canceled"],
  confirmed: ["completed", "canceled", "no_show"],
  canceled: [],
  completed: [],
  no_show: ["canceled"],
};

export function canTransitionBooking(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
) {
  return Object.hasOwn(allowedTransitions, currentStatus) && allowedTransitions[currentStatus].includes(nextStatus);
}

export function isBlockingBookingStatus(status: BookingStatus) {
  return status === "pending" || status === "confirmed";
}
```

`Object.hasOwn` is what makes `canTransitionBooking("toString", ...)` return `false` (tested at `booking-flow.test.ts:96`); a plain `allowedTransitions[currentStatus]` would find `Object.prototype.toString` and then crash on `.includes`.

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
