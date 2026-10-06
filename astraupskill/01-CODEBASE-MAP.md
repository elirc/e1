# Follow commands and reads to the same state

There are four layers in the booking path. Route handlers accept HTTP requests and return correlation-aware responses through `http.ts`. `mock-services.ts` exports the real booking service methods while retaining the other canned mock actions. `booking-service.ts` owns validation, authorization and lifecycle decisions. `booking-repository.ts` owns the cloned process-local state and synchronous transaction boundary.

## The write path, hop by hop

| Hop | File:line | What happens |
|---|---|---|
| HTTP | `src/app/api/bookings/route.ts:7-33` | Rate limit by `x-forwarded-for` (12/min), parse JSON (falls back to `{}`), call `createBooking`, map errors with `bookingFailure` |
| Facade | `src/lib/mock-services.ts:130-135` | One `createBookingService` instance wired to the shared repository and seed events/templates; its methods are re-exported as `createBooking`, `confirmBooking`, `cancelBooking`, `rescheduleBooking` |
| Validation | `src/lib/booking-service.ts:60-67` | Object check, published event lookup (`eventFor`, 25-30), trimmed email/name, email regex, one clock sample |
| Availability | `src/lib/booking-service.ts:31-45` | `offered` requires an ISO timestamp *with an offset*, finds the organizer's template and asks `generateSlots` for exactly that instant |
| Commit | `src/lib/booking-service.ts:68-80` | Inside `repository.transaction`: build booking + attendee with fresh UUIDs and token, push both |
| Storage | `src/lib/booking-repository.ts:12-21` | Clone, run, clone result, publish draft |

Confirm (`booking-service.ts:82-92`), cancel (`93-100`) and reschedule (`101-117`) follow the same shape, with `authorize` (`46-54`) as the first statement inside each transaction.

## The read path

The data module still defines seed fixtures, but `getBookings` and `getBookingAttendees` read the repository (`src/lib/demo-data.ts:477-483`). `getBookingById` and `getBookingByToken` (`586-592`) build on those getters. `getDashboardSnapshot` (`497-530`) assembles current bookings and attendees with a fresh `new Date()`. `getPublicBookingPage` (`532-584`) offers only published, non-deleted events and sends the organizer's current bookings to `generateSlots`. These are not separate copies of booking truth. The root layout exports `dynamic = "force-dynamic"` (`src/app/layout.tsx:1`) so rendered pages consult current state rather than a build-time snapshot.

Each getter call performs a full `structuredClone` of the state. `getDashboardSnapshot` calls `getBookings()` twice and `getBookingAttendees()` once, so one dashboard render clones the whole graph three times. That is harmless at seed size and a good example of a cost that only shows up when the data grows.

## Why a global

`demo-data.ts:473-475` stores the repository on `globalThis.e1BookingRepository`. That keeps module reloads or separate server bundles within one Node process pointed at the same demo state. A second process has its own repository. A restart recreates the fixtures. Tests needing isolation should construct a repository directly (`src/tests/booking-flow.test.ts:12-23`); the integration-style demo test resets the shared repository in a `finally` block (`:26-41`).

## Supporting modules

- `availability.ts` computes slots with local-date helpers from `time.ts`; it has no Next request dependency.
- `booking-state.ts` holds the transition table (`:3-10`) and cancellation-reason rule (`:35-37`).
- The service turns lifecycle failures into `BookingError` with a specific status. `bookingFailure` (`booking-service.ts:10-13`) passes known messages through and returns a generic 500 message for anything else, so internal details are not echoed to callers.

## What is still canned

Everything else in `mock-services.ts` returns fabricated objects and changes nothing: `registerOwner`, `loginOwner`, `createTeam`, `inviteMember`, `createEventType`, `updateEventType`, `setWeeklyAvailability`, `createAvailabilityOverride`, the integration functions and `getHealthSnapshot` (whose metrics are hard-coded numbers). `updateEventType` with an unknown ID silently falls back to the first event type (`mock-services.ts:90-97`). Do not read these as working features.

Trace a new booking by opening `create` in the service, then `getBookingDetail` in the facade (`mock-services.ts:145-160`), then `getBookingById` in demo-data. If a future feature reads the original seed arrays directly instead of the repository, it can recreate the initial inconsistency even though commands still succeed.

## Source excerpt

From [src/lib/demo-data.ts](../src/lib/demo-data.ts) (lines 473-483).

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
