# Reason from state and boundary predicates

For the buffer exercise, the first appointment occupies 10:00 through 11:00 after adding its trailing buffer. The second candidate at 11:00 occupies time beginning at 10:45 after adding its leading buffer, so it overlaps and must fail. A candidate at 11:30 begins occupying time at 11:15 and can succeed if every other scheduling rule passes. A different organizer's booking must not block either candidate.

For authorization, a missing resource is 404, a known resource without a matching token is 403, and a disabled guest action is also 403. A valid caller attempting an illegal terminal transition receives 409. Missing required fields and a whitespace-only cancellation reason receive 400. The service is responsible for these decisions even when called directly rather than through an HTTP route.

For state isolation, the working draft is discarded when its callback throws. The stored arrays are replaced only after the callback result can be cloned successfully. read returns a separate graph, so changes to its booking objects cannot silently modify retained data. The output of a successful command is likewise detached. This is why asserting a later read is stronger than asserting the returned object alone.

For slot generation, the cursor is anchored to the original local window. The requested date range filters candidates without shifting that anchor. A set of ISO start instants removes duplicates from overlapping windows, and positive finite integer configuration guards execute before the loop. The supplied clock keeps notice and horizon checks deterministic throughout one call.

During review, look for accidental direct access to seed bookings, service defaults that invent required values, token checks performed after mutation, or a reschedule that reuses the old token. Confirm that new attendee rows point to the replacement and historical rows still explain the predecessor. Review the original snapshots alongside these tests, then record actual commands after any further code change.

## Source excerpt

From [src/lib/booking-state.ts](../src/lib/booking-state.ts).

```ts
export function canTransitionBooking(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus,
) {
  return Object.hasOwn(allowedTransitions, currentStatus) && allowedTransitions[currentStatus].includes(nextStatus);
}

export function isBlockingBookingStatus(status: BookingStatus) {
  return status === "pending" || status === "confirmed";
}

export function transitionBooking(
  booking: Booking,
  nextStatus: BookingStatus,
  reason?: string,
  now = new Date(),
) {
  if (!canTransitionBooking(booking.status, nextStatus)) {
    throw new Error(
      `Invalid booking transition: ${booking.status} -> ${nextStatus}`,
    );
  }

  if (nextStatus === "canceled" && !reason?.trim()) {
    throw new Error("Canceled bookings must preserve a reason.");
  }

  return {
    ...booking,
    status: nextStatus,
    cancellationReason: nextStatus === "canceled" ? reason?.trim() ?? null : null,
    updatedAt: now.toISOString(),
  };
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
