# `src/lib/api-manifest.ts`

## What This File Is For

This file defines a static catalog of API endpoint groups and their summaries.

It supports `/api/docs` by exposing intended public route contracts.

## Why This File Matters

It is a contract map for onboarding and API discoverability.

For juniors, this file is useful to understand the intended surface area quickly without reading every route file first.

## Key Exports / Main Units

- Endpoint arrays:
  - `authEndpoints`
  - `teamEndpoints`
  - `eventTypeEndpoints`
  - `availabilityEndpoints`
  - `bookingEndpoints`
  - `integrationEndpoints`
  - `dashboardEndpoints`
  - `webhookEndpoints`
- `endpointGroups`, the assembled API surface.

## How It Works

- Each endpoint descriptor uses a shared type:
  - `method`, `path`, and `summary`.
- Group arrays are manually maintained.
- `/api/docs` returns this exported structure as JSON through `respond`.

## How It Connects To Other Files

- Imported by `src/app/page.tsx` to render a visual summary.
- Imported by `src/app/api/docs/route.ts` for machine-readable manifest output.
- Tied to route reality (`src/app/api/*`) but not automatically validated.

## Important Design Choices

- Handwritten endpoint list rather than route introspection.
- Domain-specific grouping for onboarding readability.
- Human-summary strings aligned with business intent.

## Things A Junior Dev Should Notice

- This is documentation of intent, not runtime guarantees.
- New API handlers can be added without updating this file, creating drift.
- Path/method typos can silently diverge from actual routes.

## Code Review Lens

Focus on drift:

- Does every implemented route appear here if intended for docs?
- Are route parameter names and methods aligned?
- Is endpoint naming stable enough for clients to depend on?

Common misses:

- Missing deprecated endpoint removal.
- Grouping that hides high-risk public operations.

## Common Change Scenarios

- Add a new route:
  - Update both API handler and this manifest together.
- Add versioning:
  - Consider metadata fields like stability and auth requirement before broadening list.
- Remove legacy endpoint:
  - Keep docs and UI references in sync.

Before editing, inspect:

- `src/app/api/docs/route.ts`,
- README route lists.

## Suggested Exercises

- Compare manifest entries with actual file paths in `src/app/api`.
- Propose one endpoint tag missing authorization metadata.
- Draft a tiny script that validates manifest path coverage against files.

## Observed Facts vs Inference

Observed:
- Manifest drives the `/api/docs` endpoint and homepage API cards.

Inference:
- This is designed as a lightweight API self-documentation layer for early-stage teams.
