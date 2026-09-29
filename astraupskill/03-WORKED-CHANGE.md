# Reschedule without losing the original appointment

Begin with the original service snapshot in the snapshots directory. It constructed a canceled predecessor before checking an offered target. The replacement spread the old booking, retaining the confirmation token and creation timestamp, and neither object was inserted into the data used by later reads. A caller could receive a successful-looking response without a durable change even within that process.

The completed method accepts a booking ID, requested timestamp and guest token. Inside a repository transaction it locates a live booking, checks token and reschedule permission, and restricts the source to pending or confirmed. It samples the clock once. The offered-slot calculation excludes only this source booking, preserving conflicts with every other event for the organizer. That exclusion also permits a deliberate reschedule to the same still-valid time.

Only after preflight succeeds does the code cancel the original. The replacement gets a distinct ID and token, refreshed createdAt and updatedAt values, a confirmed status and rescheduledFromBookingId pointing to the predecessor. Attendee records are copied with new record IDs and the replacement booking ID. Historical attendee links remain attached to the canceled predecessor for inspection.

The repository publishes all of these changes together. Returning a replacement object cannot bypass that publication, because transaction result cloning occurs before state replacement. An exception in the callback or result cloning leaves the old retained state intact. The original token can still identify the historical canceled booking, but it cannot authorize mutation of the replacement; terminal transition rules prevent reconfirming the canceled predecessor.

The regression test first requests a time outside working hours and compares the entire repository snapshot with its earlier value. It then performs a valid replacement and checks status, linkage, token rotation and timestamp changes. This makes the intended behavior reviewable through observable state rather than through implementation order alone.

## Source excerpt

From [src/lib/booking-service.ts](../src/lib/booking-service.ts).

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
  };
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
