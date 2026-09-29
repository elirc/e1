# Availability, authority and atomicity are different decisions

An available slot is a start and end instant that fits the organizer's local weekly window, overrides, blocked times, active bookings, notice period and booking horizon. The event duration determines its end. The event interval determines candidate starts. Clipping a query range must not shift that grid: a request beginning at 09:07 does not make 09:07 a valid half-hour start. Candidate starts are generated from the original window, then filtered against the requested range.

An organizer may publish several event types. Comparing only eventTypeId would let two different meetings reserve the same person at once. The implementation therefore checks organizerId and active booking status. For each existing booking it resolves that booking's event buffers, then compares the requested meeting including its own buffers. Touching interval edges are allowed; positive overlap is rejected. Canceled and soft-deleted bookings do not block future slots.

Authority is checked separately. Knowing a booking ID does not grant a guest permission to change it. Confirm, cancel and reschedule require the exact confirmation token, and the latter two also enforce guest action flags. These checks protect the command boundary in this simulator. They do not retrofit real owner login or make publicly seeded data secret.

Atomicity describes publication of state. Reschedule first verifies the target against all other bookings, then constructs a canceled predecessor, a fresh replacement and copied attendee links inside one repository transaction. Failure before commit leaves the stored graph unchanged. There is no asynchronous network call inside that callback, so another JavaScript command cannot interleave halfway through it.

These guarantees have different tests. Slot tests examine candidate times; token tests examine rejected callers; rollback tests compare complete state before and after failure. Passing one category is not proof of the other two.

## Source excerpt

From [src/lib/booking-service.ts](../src/lib/booking-service.ts).

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
