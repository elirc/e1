# Follow commands and reads to the same state

There are four layers in the booking path. Route handlers accept HTTP requests and return correlation-aware responses through http.ts. mock-services.ts now exports the real booking service methods while retaining the other explicit mock actions. booking-service.ts owns validation, authorization and lifecycle decisions. booking-repository.ts owns the cloned process-local state and synchronous transaction boundary.

The data module still defines seed fixtures, but getBookings and getBookingAttendees read the repository. getBookingById and getBookingByToken build on those getters. The dashboard assembles current bookings and attendees with a fresh clock. The public booking page offers only published, nondeleted events and sends the current organizer's bookings to generateSlots. These are not separate copies of booking truth. The root layout uses dynamic rendering so rendered pages consult current state rather than a build-time snapshot.

The global repository reference keeps module reloads or separate server bundles within one Node process pointed at the same demo state. A second process has its own repository. A restart recreates the fixtures. Tests needing isolation should construct a repository directly; the integration-style demo test resets the shared repository in a finally block.

Availability is calculated in availability.ts with local-date helpers from time.ts. That file has no Next request dependency. booking-state.ts contains legal transitions and cancellation-reason handling. The service translates lifecycle failures into BookingError with a specific status. bookingFailure exposes known messages and returns a generic message for unexpected exceptions, avoiding accidental disclosure of internal details.

Trace a new booking by opening create in the service, then getBookingDetail in the mock-service facade, then getBookingById in demo-data. The source excerpt is the concrete bridge between static fixtures and retained data. If a future feature reads the original arrays directly, it can recreate the initial inconsistency even though commands still succeed.

## Source excerpt

From [src/lib/demo-data.ts](../src/lib/demo-data.ts).

```ts
// Shared only within this Node process; restart restores the seed.
const demoGlobal = globalThis as typeof globalThis & { e1BookingRepository?: BookingRepository };
export const bookingRepository = demoGlobal.e1BookingRepository ??= createBookingRepository({ bookings, attendees });

export function getBookings() {
  return bookingRepository.read().bookings;
}

export function getBookingAttendees() {
  return bookingRepository.read().attendees;
}
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
