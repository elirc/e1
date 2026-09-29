# `src/lib/demo-data.ts`

## What This File Is For

This file stores all in-memory seed entities used by the app right now.

It is a data factory and read-path adapter used by both pages and API-facing services.

## Why This File Matters

Because most of this repo still runs on fake state, this file is effectively the data layer today.

Understanding it is essential to understand what users actually see in the UI and what routes return.

## Key Exports / Main Units

- Record arrays such as:
  - `getUsers()`
  - `getAccounts()`
  - `getMemberships()`
  - `getEventTypes()`
  - `getBookings()`
  - `getAvailabilityTemplates()`
  - `getAvailabilityOverrides()`
  - `getBlockedTimes()`
  - `getBookingAttendees()`
  - `getCalendarIntegrations()`
  - `getAuditLog()`
- Query-like helpers:
  - `getDashboardSnapshot()`
  - `getPublicBookingPage(profileSlug, eventSlug)`
  - `getBookingById(bookingId)`
  - `getBookingByToken(token)`

## How It Works

The module creates several constant arrays with a single team, three users, accounts, and a realistic set of event types and bookings.

Important internal details:

- `now` is computed once at module load.
- `isoNow` and helper `isoFromNow()` keep dates relative and stable during one runtime load.
- `getDashboardSnapshot()` derives:
  - upcoming bookings (`startTime >= now`)
  - past bookings (`startTime < now`)
  - attendee lookup map by booking ID.
- `getPublicBookingPage()`:
  - finds event by `profileSlug + slug`
  - resolves organizer and template
  - calls `generateSlots(...)` with owner-specific blockers and rules.

## How It Connects To Other Files

- `src/lib/mock-services.ts` composes most service behavior from these records.
- App pages and API routes import helper functions indirectly through services.
- `src/lib/availability.ts` is called by `getPublicBookingPage` for slot output.

## Important Design Choices

- Seed data is deterministic per process because `now` is fixed on module import.
- Helpers return internal arrays by reference.
- Cross-file consistency is achieved by storing everything in one module.

## Things A Junior Dev Should Notice

- Because arrays are shared, a write-like mutation anywhere could leak across routes.
- `getDashboardSnapshot()` uses current process time as a boundary, so server long-running behavior can become stale.
- Some object shapes include fields not used in UI/API yet, which can hide migration gaps later.

## Code Review Lens

Check for:

- Data staleness and accidental shared-mutation risk.
- Whether newly added fields are consistently filled across related records.
- Route-level behavior drift when an entity lookup fails (`null` returns).

Common risks:

- Returning references enables accidental mutation between unrelated request flows.
- Missing or inconsistent IDs across arrays break joins.
- Using `now` from module scope in asynchronous tests can produce confusing snapshots.

## Common Change Scenarios

- Add a new event type:
  - Include consistent owner/team/event metadata plus weekly rules to keep slot generation reproducible.
- Add a new booking status example:
  - Update snapshot derivation and status-driven UI expectations.
- Expand team setup:
  - Add membership and plan data together so role assumptions still hold in dashboard examples.

Before editing, inspect:

- `src/lib/mock-services.ts`,
- any route or page that assumes one team only,
- and demo pages that render IDs/titles directly.

## Suggested Exercises

- Trace an event type from `getEventTypes()` through `generateSlots()` to a rendered slot button.
- Change one `booking.status` and observe derived snapshots and UI badges.
- Add a fake blocked time and follow where it removes availability.

## Observed Facts vs Inference

Observed:
- This project is currently using in-memory seeded data as a working stand-in for persistence.
- Data helpers provide both raw and derived access patterns.

Inference:
- This file is intentionally a training scaffold and not yet production-grade storage.
- A persistence migration will require replacing this module without changing all downstream callers.
