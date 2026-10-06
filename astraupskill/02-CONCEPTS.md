# Availability, authority and atomicity are different decisions

These three words get blurred together in scheduling code. In this repo each one lives in a different function, is protected by a different check and is proven by a different kind of test.

## Availability: is this instant offerable?

An available slot is a start and end instant that fits the organizer's local weekly window, overrides, blocked times, active bookings, notice period and booking horizon. The event duration determines its end. The event interval determines candidate starts.

The grid is anchored to the availability window, not to the query. `generateSlots` walks a cursor from `window.start` in `slotIntervalMinutes` steps (`src/lib/availability.ts:155-158`) and only *afterwards* filters by `rangeStart`/`rangeEnd` (`:163`). So a request beginning at 09:07 does not make 09:07 a valid half-hour start; the first candidate is still 09:30. The service relies on this: `offered` (`src/lib/booking-service.ts:31-45`) asks for a one-slot range starting at the requested instant and accepts it only if a slot with exactly that `startTime` comes back. Off-grid times fail with 409.

Before the loop, `availability.ts:86-95` rejects non-integer, zero or negative durations and intervals, inverted ranges and ranges longer than 367 days with a `RangeError`. Without that guard a zero interval would never advance the cursor.

### Organizer-wide conflicts and buffers

An organizer may publish several event types. Comparing only `eventTypeId` would let two different meetings reserve the same person at once. The blocker list (`availability.ts:143-152`) therefore takes every booking with the same `organizerId`, skips soft-deleted ones and keeps only blocking statuses (`pending`, `confirmed` — `booking-state.ts:19-21`). For each existing booking it resolves *that booking's* event type and widens it by that event's buffers (`:148-150`). The candidate is widened by its own buffers (`:160-161`). The overlap test is strict (`:164`):

```ts
if (blockers.some(blocker => occupiedStart < blocker.end && occupiedEnd > blocker.start)) continue;
```

Touching edges are allowed; positive overlap is rejected. Canceled and soft-deleted bookings do not block.

One subtlety: if a booking's event type is not in `params.eventTypes`, line 148 falls back to the *candidate's* event type for buffers. The public page and the service both pass the full event list, so this only bites a caller that forgets the `eventTypes` parameter.

## Authority: may this caller change this booking?

Knowing a booking ID does not grant a guest permission to change it. `authorize` (`booking-service.ts:46-54`) runs first inside every mutating transaction and checks, in order: the booking exists and is not soft-deleted (404), the supplied token is a non-empty string equal to `confirmationToken` (403), and for cancel/reschedule the matching `guestCan*` flag (403).

These checks protect the command boundary. They do not make the token secret: several read surfaces still return it to unauthenticated callers (see the review in [06](06-SOLUTIONS-AND-REVIEW.md)). A guard is only as strong as the secrecy of what it compares against.

## Atomicity: when does a change become visible?

Atomicity describes publication of state. Reschedule first verifies the target against all other bookings, then constructs a canceled predecessor, a fresh replacement and copied attendee links inside one repository transaction. Failure before commit leaves the stored graph unchanged. There is no asynchronous network call inside that callback, so another JavaScript command cannot interleave halfway through it. The repository enforces this by refusing a thenable result (`booking-repository.ts:15-17`) — but note it can only detect the promise *after* the callback has run, which is still safe because the draft was never published.

## Who throws what

Lifecycle rules live in `booking-state.ts`, which throws a plain `Error`. If that reached the route, `bookingFailure` would turn it into a generic 500. The service avoids this by pre-checking with `canTransitionBooking` and throwing `BookingError(409)` itself (`booking-service.ts:55-58`). Likewise a blank cancel reason is caught by `required(reason, "reason", 1000)` as a 400 (`:96`) before `transitionBooking` ever sees it.

| Failure | Status | Raised at |
|---|---|---|
| Missing/blank/oversized field, malformed body, start time without offset | 400 | `booking-service.ts:14-18`, `:34-35`, `:61`, `:66`; routes `cancel/confirm/reschedule` line 12 |
| Unknown or soft-deleted booking, unpublished event | 404 | `:28`, `:48` |
| Wrong/missing token, guest action disabled | 403 | `:50`, `:52` |
| Slot unavailable, terminal state, no template | 409 | `:38`, `:43`, `:56`, `:104` |
| Anything else | 500 (generic message) | `:12` |

These guarantees have different tests. Slot tests examine candidate times; token tests examine rejected callers; rollback tests compare complete state before and after failure. Passing one category is not proof of the other two.

## Source excerpt

From [src/lib/booking-service.ts](../src/lib/booking-service.ts) (lines 46-54).

```ts
  function authorize(bookings: Booking[], id: string, token: unknown, action?: "cancel" | "reschedule") {
    const booking = bookings.find(item => item.id === id && !item.deletedAt);
    if (!booking) throw new BookingError(404, "Booking not found.");
    if (typeof token !== "string" || !token || booking.confirmationToken !== token)
      throw new BookingError(403, "A valid guest confirmation token is required.");
    if ((action === "cancel" && !booking.guestCanCancel) || (action === "reschedule" && !booking.guestCanReschedule))
      throw new BookingError(403, "Guest action is disabled.");
    return booking;
  }
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
