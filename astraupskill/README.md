# A booking that remains booked

The scheduling demo originally returned convincing booking objects without retaining them. A successful create response could be followed by a detail lookup that found nothing, while slot previews continued offering the same time. Cancellation and rescheduling had similar gaps. This course follows the replacement: a shared process-local repository, explicit command validation, organizer-wide availability, guest tokens and atomic replacement of a booking.

Start with the codebase map, then inspect the repository excerpt below. The read method returns a clone rather than the mutable internal arrays. The transaction method makes a working copy, invokes a synchronous callback, clones its result and only then replaces retained state. A callback that throws cannot publish its draft. This gives the demonstration a useful atomicity boundary within one JavaScript process. It does not provide database persistence, crash recovery or synchronization between server instances.

The seed contains illustrative people, calendars, event types and bookings. New booking tokens use random UUIDs. Existing seed tokens and owner-facing information belong to a public simulator; this is not a production authentication system. Registration, login, event editing and integration commands still demonstrate response shapes. No external calendar, email account or OAuth provider participates in these tests.

Use Node with TypeScript stripping support, install the package dependencies and run npm test, npm run typecheck, npm run lint and the production build command recorded in VERIFICATION. Read the failed-request tests as carefully as the success test. The important contract is that a rejected reschedule leaves both the original booking and its attendee linkage unchanged. Later chapters explain how to prove that contract without relying on a screenshot or a returned success message.

## Source excerpt

From [src/lib/booking-repository.ts](../src/lib/booking-repository.ts).

```ts
export function createBookingRepository(seed: BookingState) {
  const original = structuredClone(seed);
  let state = structuredClone(original);
  return {
    read: (): BookingState => structuredClone(state),
    reset: () => { state = structuredClone(original); },
    transaction<T>(work: (draft: BookingState) => T): T {
      const draft = structuredClone(state);
      const result = work(draft);
      if (result && typeof result === "object" && "then" in result) {
        throw new Error("Booking transactions must be synchronous.");
      }
      const output = structuredClone(result);
      state = structuredClone(draft);
      return output;
    },
  };
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
