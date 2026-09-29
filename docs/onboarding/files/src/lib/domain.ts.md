# `src/lib/domain.ts`

## What This File Is For

`src/lib/domain.ts` is the shared type-language layer of the app. It defines the nouns, status enums, and data contracts used across services, pages, and API routes.

It is mostly a static contract file: interfaces, aliases, and enums only.

## Why This File Matters

Because many files rely on these types, this is the fastest way to understand the business vocabulary of the system:

- Who is an owner or member?
- What is an event type vs. a booking?
- What transitions and statuses are legal?
- How are availability rules represented in memory and expected by services?

It teaches the most important beginner lesson in this repo: shared contracts are how you keep many surfaces aligned.

## Key Exports / Main Units

- Primitive alias types such as `Identifier`, `ISODateString`, and `ISODateTimeString`.
- Core enums for `TeamRole`, `BookingStatus`, `LocationType`, `TimezonePolicy`, and integration-related types.
- Core entity interfaces, including `User`, `Team`, `TeamMembership`, `EventType`, `Booking`, `AvailabilityTemplate`, `AvailabilityOverride`, and `BookingAttendee`.
- Composite contracts such as:
  - `DashboardSnapshot`
  - `PublicBookingPageModel`
  - `SlotPreview`
  - `EndpointDescriptor`

## How It Works

The file is structured in small blocks:

- type aliases for string-like IDs and timestamps.
- union enums describing stable domain options.
- entity interfaces for users, teams, roles, booking lifecycle, availability, and integrations.
- model variants for payload shaping across flows.

There is no behavior here, only shape. That means this file’s correctness is mostly about expressiveness and consistency, not algorithms.

## How It Connects To Other Files

This file is imported in:

- `src/lib/booking-state.ts` for status transitions.
- `src/lib/availability.ts` and `src/lib/time.ts` for typed inputs and outputs.
- `src/lib/demo-data.ts` and `src/lib/mock-services.ts` for full in-memory objects.
- API handlers through page and service return types.

Because it is a shared contract file, its changes have wide blast radius.

## Important Design Choices

- Use of explicit timestamp string aliases instead of raw `Date` instances.
- Rich enum sets for status and policy states, which favor compile-time correctness.
- `deletedAt` in nearly every major type to normalize soft-delete behavior at the model level.
- A dedicated `EndpointDescriptor` type that helps keep API docs and route intent consistent.

## Things A Junior Dev Should Notice

- Enum values are the "source of truth for UI chips and API decisions."
- Some runtime paths assume values exist (for example, `eventType.timezone`) but not every input source validates them.
- The domain model already contains fields for complex flows (team routing, subscriptions, audit), but current runtime services only touch part of them.

## Code Review Lens

When reviewing changes in this file, check:

- Is the new value truly a new domain concept?
- Is any consumer assuming a narrower set than the shared type now permits?
- Are we adding field-level optionality that will silently break existing UI assumptions?
- Do type unions match Prisma enums and API validation once database integration arrives?

Risk hotspots:

- Widening status enums without updating transitions and UI states.
- Adding required fields without migration in mock data and route handlers.
- Adding fields with ambiguous units (for example, minutes vs seconds).

## Common Change Scenarios

- Add a new booking status:
  - Update this file, `src/lib/booking-state.ts`, and any UI badges using status switches.
- Add cancellation metadata:
  - Extend `Booking` and inspect all places that clone or render booking records.
- Add new notification channel:
  - Update this file plus any API contracts and integration models.

Before editing, inspect:

- `src/lib/booking-state.ts`,
- `src/lib/demo-data.ts`,
- and any dashboard or API serializers using the affected type.

## Suggested Exercises

- Pick one field in `Booking` and trace where it appears in UI and services.
- Identify one type that is currently modeled but not used by runtime code.
- Add a temporary helper type in notes that maps "booking lifecycle by status" and compare against actual service behavior.

## Observed Facts vs Inference

Observed:
- This file defines shared domain vocabulary used by almost every major layer.
- Most entity types are intentionally strict with explicit required fields.

Inference:
- The project is designed for eventual production hardening, and this file is the forward-compatible surface for that migration.
- Some types are currently richer than the runtime functions, indicating intentionally staged implementation.
