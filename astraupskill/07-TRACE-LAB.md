# Trace one failed replacement and one successful replacement

Choose a fresh deterministic fixture and create a 10:00 appointment. Record its booking ID, confirmation token, status, attendee ID, createdAt and updatedAt. Read the repository immediately afterward; the retained graph should contain one booking and one attendee. Keep that complete graph as the comparison baseline rather than retaining references to mutable objects.

Now request a reschedule to 19:00 with the correct token. Step through authorize, the active-status check and offered. Authorization succeeds, but the target falls outside the configured 09:00 through 18:00 window. offered raises a conflict before the source booking is transitioned. The repository callback exits through the exception path, leaving both arrays equal to the baseline. The route translates the typed error into 409 without exposing an internal stack.

Repeat with an 11:00 target and a later injected clock. The availability input contains all active organizer bookings except the source. After a slot match, transition creates the canceled predecessor. A separate replacement receives a random ID and token, fresh timestamps and the predecessor ID. Each linked attendee is copied with a new ID. The callback updates the predecessor, appends the replacement and appends those copied attendees. Only then does the repository publish the completed draft.

Read by both tokens. The old token should still identify the canceled historical booking; it must not identify or authorize the new appointment. A confirm attempt against the predecessor should fail with a terminal conflict. A cancel attempt against the replacement using the old token should fail with forbidden. These checks distinguish history preservation from authority transfer.

Finally inspect the public slot preview. The new occupied interval should disappear for all events sharing the organizer, while the old interval may return if no other blockers or notice rules exclude it. Explain that final qualification before concluding that a particular missing slot is a repository bug.

## Source excerpt

From [src/lib/booking-service.ts](../src/lib/booking-service.ts).

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
