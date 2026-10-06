# Exercises with observable outcomes

Every exercise ends with a **Check** you can run on a fresh clone with no `npm install`. Put your work in one file, `src/tests/practice.test.ts`, and run:

```
node --loader ./scripts/alias-loader.mjs --experimental-strip-types --test src/tests/practice.test.ts
```

(`npm test` will also pick the file up because it globs `src/tests/*.test.ts`. Delete or rename the file when you are done if you do not want it in the suite.)

Start the file with this fixture. It is a trimmed copy of the one in `src/tests/booking-flow.test.ts:11-24`: one organizer, two published 30-minute event types on a 30-minute grid, 09:00-18:00 UTC every day, no buffers, a fixed clock of Monday 2026-09-21 08:00 UTC.

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createBookingRepository } from "@/lib/booking-repository";
import { createBookingService, BookingError } from "@/lib/booking-service";
import { getEventTypes, getAvailabilityTemplates, bookingRepository } from "@/lib/demo-data";
import { listUpcomingBookings, cancelBooking } from "@/lib/mock-services";
import { rateLimit } from "@/lib/rate-limit";

const now = new Date("2026-09-21T08:00:00Z");
function fixture() {
  const event = { ...structuredClone(getEventTypes()[0]), timezone: "UTC", published: true,
    durationMinutes: 30, slotIntervalMinutes: 30, minNoticeMinutes: 0, maxDaysInFuture: 30,
    bufferBeforeMinutes: 0, bufferAfterMinutes: 0 };
  const other = { ...event, id: "evt_second" };
  const template = { ...structuredClone(getAvailabilityTemplates()[0]), organizerId: event.organizerId, timezone: "UTC",
    weeklyRules: Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, ranges: [{ startTime: "09:00", endTime: "18:00" }] })) };
  const repository = createBookingRepository({ bookings: [], attendees: [] });
  const service = createBookingService({ repository, events: [event, other], templates: [template],
    overrides: [], blockedTimes: [], clock: () => now });
  const input = { eventTypeId: event.id, startTime: "2026-09-21T10:00:00Z", attendeeName: "Guest", attendeeEmail: "guest@example.com" };
  return { event, other, template, repository, service, input };
}
const status = (code: number) => (e: unknown) => e instanceof BookingError && e.status === code;
```

The `status(code)` helper matters: `assert.throws(fn)` alone passes for *any* exception, including a typo that throws `TypeError`. Always assert the specific status.

---

## Exercise 1 — Map every rejection to its status (easy)

**Goal.** Prove, against the service directly, that each failure category in [02-CONCEPTS](02-CONCEPTS.md#who-throws-what) produces the documented status.

**Hints.** Create one booking with `f.service.create(f.input)`, then call `cancel` with: an unknown ID; the right ID and a wrong token; the right token and a whitespace-only reason. Then cancel it properly and try to `confirm` it. Which of those reaches `transitionBooking` at all?

**Check.** One test containing four `assert.throws(..., status(N))` calls — 404, 403, 400, 409 — passes.

## Exercise 2 — Predict a cross-event buffer (easy-medium)

**Goal.** Give the second event type (`f.other`) a 30-minute *leading* buffer. With a first-event booking at 10:00-10:30, predict whether the second event can be booked at 10:30 and at 11:00. Write the prediction down before running anything.

**Hints.** Draw the occupied interval of each candidate: `[start - bufferBefore, end + bufferAfter)`. Overlap is strict (`availability.ts:164`), so touching edges are fine. The existing test at `booking-flow.test.ts:62-68` covers a different buffer combination; do not copy its numbers.

**Check.** A test where 10:30 throws `status(409)` and 11:00 returns a booking whose `startTime` is `"2026-09-21T11:00:00.000Z"` passes.

## Exercise 3 — Break the transaction boundary with `async` (medium)

**Goal.** Show that the repository refuses an async callback *and* does not publish whatever that callback did to the draft before it returned.

**Hints.** Create one booking, then call `f.repository.transaction(async draft => { draft.bookings.length = 0; })`. An `async` function runs synchronously up to its first `await`, so the draft really is emptied before the guard on `booking-repository.ts:15-17` sees the promise. What does `read()` return afterwards?

**Check.** `assert.throws(..., /synchronous/)` passes and `f.repository.read().bookings.length` is still `1`.

## Exercise 4 — Where else is the guest token visible? (medium)

**Goal.** The cancel route requires the guest's confirmation token. Check whether any unauthenticated read surface also returns that token, and write a characterization test that documents what it allows today.

**Hints.** Look at what `GET /api/dashboard/upcoming` returns (`src/app/api/dashboard/upcoming/route.ts` → `listUpcomingBookings` → `getDashboardSnapshot`). Does any projection strip `confirmationToken`? This test touches the **shared** demo repository, so wrap it in `bookingRepository.reset(); try { ... } finally { bookingRepository.reset(); }` as `booking-flow.test.ts:26-41` does.

**Check.** A test that reads a booking with `guestCanCancel: true` from `listUpcomingBookings()`, passes its `confirmationToken` to `cancelBooking`, and asserts the result's `status` is `"canceled"` passes. (This is a characterization test: it passes because the hole exists. 06 discusses the fix, after which you would invert it.)

## Exercise 5 — Does rescheduling skip approval? (medium-hard)

**Goal.** Decide what status a replacement booking should have when the source was `pending`, then find out what the code does.

**Hints.** Create a booking, then force it to pending with `f.repository.transaction(state => { state.bookings[0].status = "pending"; })`. Reschedule it to 11:00 with its token. Read `booking-service.ts:108`.

**Check.** A test asserting `replacement.status === "confirmed"` passes. Write one sentence in a comment explaining whether you think that is correct for an event that requires host confirmation.

## Exercise 6 — Characterize the rate-limit key (hard)

**Goal.** `POST /api/bookings` allows 12 attempts per minute per key, where the key is built from the raw `x-forwarded-for` header (`src/app/api/bookings/route.ts:8-9`). Write a characterization test showing how the key behaves when the header value changes.

**Hints.** Call `rateLimit` directly with the same key format the route uses: `` `create-booking:${ip}` ``, 12, 60 000. Use an IP string nobody else in the file uses — the bucket `Map` in `src/lib/rate-limit.ts:1` is module-global and never cleared. What happens if the header value is `"203.0.113.9, anything"`?

**Check.** A test where 12 calls with one key are allowed, the 13th is refused, and a call with a different header string is allowed again passes.

## Exercise 7 — Design the persistent version (design, no code)

**Goal.** Replace `createBookingRepository` with Postgres on paper. Use `prisma/schema.prisma` as the starting model.

**Hints.** The in-memory transaction makes "check availability, then insert" atomic only because JavaScript is single-threaded. Two server processes break that. Consider an exclusion constraint on `(organizerId, tstzrange(start - bufferBefore, end + bufferAfter))` filtered to active statuses, versus `SERIALIZABLE` isolation with retry, versus a per-organizer advisory lock. Where would a calendar-provider write go so that a provider outage cannot leave a booking half-created?

**Check.** Your design names (a) the constraint or lock that prevents two competing organizer bookings, (b) the isolation level, (c) what happens on a constraint violation (should map to 409, like `offered` today), and (d) an outbox or retry table for provider writes. Compare with the discussion in [06](06-SOLUTIONS-AND-REVIEW.md#exercise-7).

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
