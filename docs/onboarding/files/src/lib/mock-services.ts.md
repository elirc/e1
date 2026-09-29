# `src/lib/mock-services.ts`

## What This File Is For

This file is the service boundary for current behavior. It simulates business operations for auth, teams, event types, availability, bookings, and integrations.

It is intentionally higher-level than raw data helpers and lower-level than API protocol logic.

## Why This File Matters

Most API routes delegate to this file, so it is where real invariants should ideally be enforced in this repo.

It teaches:

- where write operations happen,
- how errors are shaped,
- how service responses are composed from demo records.

## Key Exports / Main Units

- Identity and auth helpers:
  - `registerOwner`, `loginOwner`
- Team and membership:
  - `createTeam`, `inviteMember`, `assignMembershipRole`
- Event type operations:
  - `listEventTypes`, `getEventType`, `createEventType`, `updateEventType`
- Availability helpers:
  - `getAvailabilityWindow`, `previewSlots`, `setWeeklyAvailability`, `createAvailabilityOverride`
- Booking operations:
  - `createBooking`, `confirmBooking`, `cancelBooking`, `rescheduleBooking`
  - `getBookingDetail`, `getBookingDetailByToken`, `listUpcomingBookings`, `listPastBookings`
- Integration helpers:
  - `connectIntegration`, `refreshIntegration`, `disconnectIntegration`
- Health and dashboard read helper:
  - `getHealthSnapshot`

## How It Works

The module mostly reads from `src/lib/demo-data.ts` and applies simple business transformations:

- `createBooking` validates event type existence and checks for overlap with active bookings.
- `confirmBooking` and `cancelBooking` delegate state transitions to `booking-state.ts`.
- `rescheduleBooking` cancels old booking (with reason) and creates a replacement with new start time.
- `getBookingDetail` and token detail combine booking + attendee + event type references into one response.

Most functions are synchronous and return plain objects rather than persisted entities.

## How It Connects To Other Files

- Called by almost every important API route in `src/app/api/*`.
- Used by server pages through indirect dependencies (`src/lib/demo-data.ts` is also used by pages).
- Depends on:
  - `src/lib/booking-state.ts` for transitions
  - `src/lib/demo-data.ts` for seeded records
  - `src/lib/availability.ts` and `src/lib/time.ts` for slot behavior

## Important Design Choices

- Fast path over persistence: every function is deterministic and side-effect light.
- Business logic and data shape generation are centralized instead of duplicated in each route.
- Some write-like actions return synthetic IDs and values instead of mutating long-term storage.

## Things A Junior Dev Should Notice

- `list*` and `get*` mostly forward raw demo data.
- `createBooking` checks conflicts only for same `eventTypeId` and `confirmed/pending` statuses.
- `rescheduleBooking` marks previous booking as canceled and creates a new booking rather than updating start time in place.
- Several auth/team helpers return placeholders when dependencies are missing.

## Code Review Lens

Critical review points:

- Are conflict checks exhaustive enough for production rules?
- Are state transitions the single path, or are there direct object edits elsewhere?
- Does a function return the right shape for route consumers, especially on errors?

Potential review misses:

- Multi-instance races are not addressed in in-memory logic.
- Role and permission checks are absent; routes currently trust endpoint-level intent.
- Placeholder auth/account behavior might mask missing edge-case handling.

## Common Change Scenarios

- Add real persistence:
  - Replace reads/writes in this file first, keep route signatures stable, then update tests.
- Add new booking guard:
  - Update `createBooking` and ensure preview and dashboard surfaces also respect it.
- Introduce host reassignment logic:
  - `createBooking` and event-type lookup logic will need owner consistency checks.

Before editing, inspect:

- affected route handlers,
- `src/lib/booking-state.ts`,
- and any page logic that depends on response fields.

## Suggested Exercises

- Add a new service function for "cancel a booking by token" and decide who owns authorization checks.
- Trace the full `rescheduleBooking` output and identify which records changed.
- Add one impossible transition in tests by reading and applying `transitionBooking` through this service.

## Observed Facts vs Inference

Observed:
- Service methods are in-memory and synchronous.
- The module combines domain logic and adapter-like shaping.

Inference:
- The pattern is a stepping stone toward repository/services + database adapters.
- Permission and auth are intentionally not implemented here yet; routes may need a middleware boundary later.
