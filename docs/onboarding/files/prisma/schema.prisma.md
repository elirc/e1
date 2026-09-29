# `prisma/schema.prisma`

## What This File Is For

This file defines the canonical persistence model for the app. It is the long-term contract for users, teams, event types, availability, bookings, integrations, and related operational data.

It acts as an entry point for the data architecture even though this repository currently reads from in-memory seed data.

## Why This File Matters

The schema is the strongest signal for:

- Which entities are considered durable in the real implementation.
- Which foreign-key relationships and deletion rules must stay consistent.
- Which constraints and indexes will matter for data integrity and performance.
- Which concepts belong to business logic versus transient API glue.

For a junior dev, this file teaches how the domain is expected to scale from "prototype behavior" to production.

## Key Exports / Main Units

- Prisma client generator and datasource block for PostgreSQL.
- Enum types like `BookingStatus`, `TeamRole`, `NotificationChannel`, and `PlanTier`.
- Core models such as:
  - `User`
  - `Team`
  - `EventType`
  - `AvailabilityTemplate`
  - `AvailabilityOverride`
  - `BlockedTimeRange`
  - `Booking`
  - `BookingAttendee`
  - `CalendarIntegration`
  - `Notification`
  - `AuditLog`
  - `SubscriptionPlan`
- A `soft delete` convention is implicit via many nullable `deletedAt` fields.

## How It Works

The schema first declares how Prisma connects and generates a client, then defines enums and models.

Most models follow a recurring pattern:

- required `id`, `createdAt`, `updatedAt` fields
- optional `deletedAt` fields for logical deletion
- relations back to `Team`, `User`, or `Booking`
- indexes for common query patterns (team-scoped lookups, owner lookups, status windows, time filters)

`Booking` is the core behavioral entity. Notable contract choices include:

- `status` constrained by `BookingStatus` enum.
- unique confirmation token for guest access.
- explicit start/end timestamps and venue/location fields.

`EventType` includes publication state, buffer values, timezone policy, and unique constraints that couple public routing behavior with persistence identity.

`AvailabilityTemplate` and `AvailabilityOverride` store recurring and ad-hoc scheduling rules.

## How It Connects To Other Files

Observed file dependencies:

- `src/lib/domain.ts` mirrors many entity shapes as TypeScript interfaces.
- `src/app` routes and dashboard pages are built around these model concepts.
- `README.md` and onboarding docs describe the intended migration from in-memory data to this schema.

The schema does not run code at runtime today, so the main connection is strategic: it tells you where real persistence must be added.

## Important Design Choices

- Separate `DateTime`-based availability rules and JSON payload (`weeklyRulesJson`, `rangesJson`) to keep shape flexible while keeping schema migrations stable.
- Use explicit `onDelete` behavior to encode ownership and retention policies:
  - `Restrict` for important identity edges (users owning events/bookings).
  - `Cascade` for cleanup where history can safely follow parent deletion.
- Use indexes on high-frequency read dimensions (`teamId`, `startTime`, `status`, `organizerId`) as a clear performance signal.
- Keep `deletedAt` across key tables to support auditability and soft recovery patterns.

## Things A Junior Dev Should Notice

- `EventType` uses `@@unique([teamId, slug])` and also `@@unique([profileSlug, slug])`, meaning publication identity and public URLs are not equivalent.
- `EventType.slug` is not globally unique, but `profileSlug + slug` can become the public route key.
- `CalendarIntegration` is modeled with token fields, implying future OAuth/token lifecycle work not present in the current mocks.
- Some models (`PaymentProfile`, `SubscriptionPlan`) are complete even though runtime code does not yet consume them.
- Several enums and domain types in `src/lib/domain.ts` are close but not identical in shape, so the migration path needs careful alignment.

## Code Review Lens

Focus areas for this file:

- Constraint coverage: Are every business invariants also constrained here?
- Index strategy: Do new read patterns have matching indexes before scale?
- Cascade semantics: Could a cascade delete erase records that should be auditable?
- Soft-delete consistency: Are all new query paths filtering `deletedAt` as intended?
- JSON payload shape changes: Are consumers ready for schema changes in rule payloads?

Common risks:

- Diverging this schema from `src/lib/domain.ts` and service logic.
- Adding models without documenting migration and migration-time data backfills.
- Assuming production behavior from mock-data logic when schema fields are currently absent in memory.

## Common Change Scenarios

- Add a new booking rule field:
  - Update schema, domain type, and slot/booking service code together.
- Introduce a new notification channel:
  - Touch `NotificationChannel`, service payloads, and any UI/cron assumptions together.
- Add a new webhook event record:
  - Add schema model and ensure existing API/webhook route responses carry enough metadata.
- Enforce additional uniqueness:
  - Update schema constraints and any in-memory lookup helpers that currently dedupe differently.

Before editing, check:

- existing migration scripts (if added later),
- query surfaces in API routes,
- and any assumptions in `src/lib/demo-data.ts` if still used for staging.

## Suggested Exercises

- Trace one in-memory booking create flow and write down which schema fields are missing today.
- Compare `EventType` fields from schema and domain types and list mismatches.
- Sketch which two indexes you would add for a new API endpoint that returns upcoming bookings by organizer.
- Propose a soft-delete-safe query pattern for team dashboard lists.

## Observed Facts vs Inference

Observed facts:
- The schema models full production persistence for bookings, availability, teams, and webhooks.
- Unique and index constraints are present for identity and performance-sensitive queries.
- No runtime code imports this file directly for data reads.

Inference:
- The in-memory mock layer is a temporary adapter until Prisma client and migrations are wired.
- The presence of `PaymentProfile` and `SubscriptionPlan` suggests billing and plan enforcement are planned but not currently implemented.
