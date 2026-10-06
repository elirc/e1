# Reschedule without losing the original appointment

Begin with the original service in `snapshots/src__lib__mock-services.ts.original.txt` (its `rescheduleBooking` starts at line 216). It constructed a canceled predecessor before looking at the requested target at all, and never checked that target against availability. The replacement spread the old booking, retaining the confirmation token and creation timestamp, and neither object was inserted into the data used by later reads. A caller could receive a successful-looking response without any retained change, even within one process.

Run the diff yourself:

```
git diff --no-index astraupskill/snapshots/src__lib__mock-services.ts.original.txt src/lib/mock-services.ts
```

About 120 lines of create/confirm/cancel/reschedule logic collapse into six lines that wire up `createBookingService` (`src/lib/mock-services.ts:130-135`). The logic moved to `src/lib/booking-service.ts`.

## Before and after

| Concern | Original snapshot | Current `booking-service.ts` |
|---|---|---|
| Who may reschedule | Anyone with the ID | `authorize(..., "reschedule")` checks token and `guestCanReschedule` (`:103`) |
| Source state | Not checked | Must be `pending` or `confirmed`, else 409 (`:104`) |
| Target time | Not validated; any string accepted | `offered` requires offset ISO, on-grid, inside hours/notice/horizon, no organizer conflict (`:106`) |
| Self-conflict | n/a | Source excluded from the blocker list so the same slot can be kept (`:106`, `filter(item => item.id !== id)`) |
| Replacement ID / token | New ID, **same token** | New ID and new token (`:108-109`) |
| Timestamps | `createdAt` copied from old booking | Both refreshed from one clock sample (`:105`, `:110`) |
| Attendees | Not copied | Copied with new IDs pointing at replacement (`:111-112`) |
| Persistence | Returned only | Predecessor replaced, replacement and attendees appended inside one transaction (`:113-114`) |

## Walking the new method

1. **Authorize inside the transaction** (`:102-103`). Checking inside the callback means the booking being authorized is the same object that will be modified, read from the same draft.
2. **Restrict the source** (`:104`). Without this, a canceled booking with a still-valid token could spawn a new confirmed booking.
3. **Sample the clock once** (`:105`). Notice and horizon checks and both timestamps use the same `now`, so a slow call cannot straddle a boundary.
4. **Preflight the target** (`:106`). `offered` throws 409 if the slot is not available. Nothing has been changed yet.
5. **Cancel the original** (`:107`) through `transition`, which pre-checks with `canTransitionBooking` and supplies the reason `"Rescheduled by guest"`.
6. **Build the replacement** (`:108-110`). The spread `{ ...booking, ...slot, ... }` copies event, organizer, title and guest flags, then overrides time, ID, status, token, reason, link and timestamps.
7. **Copy attendee links** (`:111-112`). Historical attendee rows stay attached to the predecessor for inspection.
8. **Mutate the draft and return** (`:113-115`). The repository publishes only after the callback returns and its result clones.

An exception at any step leaves the old retained state intact. The original token can still identify the historical canceled booking through `getBookingByToken`, but it cannot authorize mutation of the replacement; terminal transition rules prevent reconfirming the canceled predecessor.

Two behaviors worth questioning in review (both verified in [06](06-SOLUTIONS-AND-REVIEW.md)): a `pending` source produces a `confirmed` replacement because `status: "confirmed"` is hard-coded on line 108, and the replacement inherits `guestCanCancel`/`guestCanReschedule` from the source via the spread.

## The regression test

`src/tests/booking-flow.test.ts:69-80` first requests 19:00 (outside the fixture's 09:00-18:00 hours) and compares the entire repository snapshot with its earlier value using `assert.deepEqual`. It then builds a new service with a later clock, performs a valid move to 11:00 and checks status, linkage, token rotation and timestamp change. Finally it proves the old token cannot cancel the replacement (403) and the canceled predecessor cannot be reconfirmed (409). Line 81-83 separately proves a booking can be "rescheduled" onto its own slot.

## Source excerpt

From [src/lib/booking-service.ts](../src/lib/booking-service.ts) (lines 101-117).

```ts
    reschedule(id: string, startTime: unknown, token: unknown) {
      return repository.transaction(state => {
        const booking = authorize(state.bookings, id, token, "reschedule");
        if (booking.status !== "pending" && booking.status !== "confirmed") throw new BookingError(409, "Only active bookings can be rescheduled.");
        const now = clock();
        const slot = offered(eventFor(booking.eventTypeId), startTime, state.bookings.filter(item => item.id !== id), now);
        const previous = transition(booking, "canceled", now, "Rescheduled by guest");
        const replacement: Booking = { ...booking, ...slot, id: `book_${crypto.randomUUID()}`, status: "confirmed",
          confirmationToken: crypto.randomUUID(), cancellationReason: null, rescheduledFromBookingId: id,
          createdAt: now.toISOString(), updatedAt: now.toISOString() };
        const attendees = state.attendees.filter(item => item.bookingId === id).map(item => ({ ...item,
          id: `att_${crypto.randomUUID()}`, bookingId: replacement.id, createdAt: now.toISOString(), updatedAt: now.toISOString() }));
        state.bookings[state.bookings.findIndex(item => item.id === id)] = previous;
        state.bookings.push(replacement); state.attendees.push(...attendees);
        return { previous, replacement };
      });
    },
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
