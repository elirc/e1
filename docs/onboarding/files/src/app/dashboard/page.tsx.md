# `src/app/dashboard/page.tsx`

## What This File Is For

This is the main owner dashboard page in the current scaffold.

It composes a high-level snapshot of events, upcoming bookings, integration health, and operational metrics.

## Why This File Matters

This page teaches how multiple domain read models combine into a single ownership surface:

- event inventory
- upcoming bookings
- audit visibility
- integration status

It is a practical "read model consumer" example and shows where UI can accidentally become over-coupled to seeded structures.

## Key Exports / Main Units

- Default function: `DashboardPage()`
- Uses:
  - `DashboardShell`
  - `getDashboardSnapshot`
  - `getPublicBookingPage`
  - `endpointGroups`
  - utility formatters

## How It Works

- Calls `getDashboardSnapshot()` and a specific public page lookup.
- Renders:
  - metric cards for counts and statuses,
  - booking links and attendee labels,
  - event type status pills,
  - integration list.
- Maps all rendering from service-level data instead of performing side effects.

There is no direct data mutation in this file.

## How It Connects To Other Files

- `src/lib/demo-data.ts`: source of snapshot and public page sample.
- `src/components/dashboard-shell.tsx`: layout composition wrapper.
- `src/components/ui.tsx`: card and surface primitives.
- `src/app/api/docs/route.ts` and `src/lib/api-manifest.ts`: endpoint groups displayed in the UI.

## Important Design Choices

- Snapshot-first architecture for dashboard rendering.
- Strong preference for map/filter transforms directly in JSX for readability.
- Navigation and data concerns are separated through components and data functions.

## Things A Junior Dev Should Notice

- Some labels and assumptions are hardcoded and can mask backend mismatch.
- This page expects `getDashboardSnapshot()` to include consistent attendee linkage.
- Slots and integration counts are presented as metrics but are not all independent sources.

## Code Review Lens

Review focus:

- If a field becomes null in data layer, does page handle it gracefully?
- Are list keys stable for React reconciliation?
- Are computed fields (`snapshot.*`) in sync with actual service filters?

Common issues:

- Rendering guest data that depends on non-null snapshots.
- Unclear separation between presentation and business policy (e.g., SLA text in the UI).
- Using mock-only assumptions as production contracts (for example, hardcoded role wording).

## Common Change Scenarios

- Add a new dashboard metric:
  - Extend `DashboardSnapshot`, then update UI cards and any API surfaces.
- Add sorting/filtering controls:
  - Keep list keys and data derivation pure and stable.
- Replace seed snapshot with API call:
  - Introduce loading/error state boundaries.

Before editing, inspect:

- `src/lib/demo-data.ts#getDashboardSnapshot`,
- service layer returning snapshot fields,
- and routing links to booking detail pages.

## Suggested Exercises

- Trace how one booking card appears from seed data to rendered card fields.
- Add one defensive check for missing attendee and propose fallback behavior.
- Replace a hardcoded "next booking" date source with a dedicated helper and compare outcomes.

## Observed Facts vs Inference

Observed:
- This page is currently server-rendered from synchronous mock snapshot data.

Inference:
- It is designed for quick product visualization and will need loading and stale-state handling when moved to real APIs.
