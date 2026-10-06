# Trace one failed replacement and one successful replacement

This lab is the narrative version of `src/tests/booking-flow.test.ts:69-80`. Do it with a debugger or with `console.log` in a scratch test using the fixture from [05-PRACTICE](05-PRACTICE.md); either way, write down each value before you look at the next step.

## 1. Baseline

Choose a fresh deterministic fixture (clock Monday 2026-09-21 08:00 UTC, hours 09:00-18:00 UTC) and create a 10:00 appointment. Record its booking ID, confirmation token, status, attendee ID, `createdAt` and `updatedAt`. Read the repository immediately afterward; the retained graph should contain one booking and one attendee. Keep that complete graph (`const before = f.repository.read()`) as the comparison baseline rather than retaining references to mutable objects — `read()` already gives you a detached clone.

## 2. Failed replacement: 19:00

Request a reschedule to `2026-09-21T19:00:00Z` with the correct token. Step through:

| Step | Location | Result |
|---|---|---|
| Clone draft | `booking-repository.ts:13` | draft is a deep copy |
| `authorize` | `booking-service.ts:103` → `:46-54` | booking found, token matches, `guestCanReschedule` true |
| Active-status check | `:104` | `confirmed` passes |
| `offered` | `:106` → `:31-45` | timestamp has an offset; template found; `generateSlots` for 19:00-19:30 returns `[]` because 19:00 is after the 18:00 window end |
| Throw | `:43` | `BookingError(409, "Requested time is unavailable.")` |
| Repository | `booking-repository.ts:14` | exception propagates out of `work(draft)`; line 19 never runs |

`f.repository.read()` is now deep-equal to `before`. Through HTTP, the route's `catch` (`src/app/api/bookings/[bookingId]/reschedule/route.ts:15-18`) passes the error to `bookingFailure`, which returns status 409 and the message — no stack trace.

## 3. Successful replacement: 11:00

Repeat with an 11:00 target and a later injected clock (08:30). The test builds a *new* service for this (`booking-flow.test.ts:73`) because the clock is captured when the service is created.

- The blocker list passed to `offered` is `state.bookings.filter(item => item.id !== id)` — every active organizer booking except the source.
- After the slot matches, `transition` creates the canceled predecessor with reason `"Rescheduled by guest"`.
- The replacement gets a random ID and token, `createdAt`/`updatedAt` of 08:30, and `rescheduledFromBookingId` pointing at the predecessor.
- Each linked attendee is copied with a new ID and the replacement's `bookingId`.
- The callback replaces the predecessor in place, appends the replacement and the copied attendees, and returns. Only then does line 19 publish the draft.

Predict the counts before you read them: the retained graph should now have **two** bookings and **two** attendee rows.

## 4. Old token versus new token

Read by both tokens with `getBookingByToken` (or `getBookingDetailByToken` for attendees). The old token still identifies the canceled historical booking; it does not identify the new appointment. Then:

- `service.confirm(predecessor.id, oldToken)` → 409. Token is valid, but `canceled → confirmed` is not in the transition table (`booking-state.ts:7`).
- `service.cancel(replacement.id, "x", oldToken)` → 403. Right booking, wrong token.

These two checks distinguish history preservation from authority transfer.

## 5. The public view

Finally inspect the public slot preview with `getPublicBookingPage(profileSlug, eventSlug)` on the shared demo repository (reset it afterwards). The new occupied interval should disappear for every event type sharing the organizer, while the old interval may return if no other blocker, notice rule or the 24-slot cap (`availability.ts:173`) hides it. Explain that final qualification before concluding that a particular missing slot is a repository bug.

## Source excerpt

From [src/lib/booking-service.ts](../src/lib/booking-service.ts) (lines 31-45).

```ts
  function offered(event: EventType, value: unknown, bookings: Booking[], now: Date) {
    const start = required(value, "startTime");
    // Require an explicit offset; never interpret a caller's local wall time as server time.
    if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(start) || !Number.isFinite(Date.parse(start)))
      throw new BookingError(400, "startTime must be an ISO timestamp with an offset.");
    const instant = new Date(start);
    const template = options.templates.find(item => item.organizerId === event.organizerId && !item.deletedAt);
    if (!template) throw new BookingError(409, "No availability configured.");
    const slots = generateSlots({ eventType: event, template, overrides: options.overrides,
      blockedTimes: options.blockedTimes, bookings, eventTypes: options.events,
      rangeStart: instant, rangeEnd: new Date(instant.getTime() + event.durationMinutes * 60_000), now, limit: 1 });
    const slot = slots.find(item => item.startTime === instant.toISOString());
    if (!slot) throw new BookingError(409, "Requested time is unavailable.");
    return slot;
  }
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
