# `src/app/book/[profileSlug]/[eventSlug]/page.tsx`

## What This File Is For

This is the public booking page entry route.

It accepts route params, resolves a public event page model, and renders slot options plus attendee form placeholders.

## Why This File Matters

This is the most visible conversion path for guests.

It demonstrates how route params feed into domain lookups and UI rendering in an App Router page.

## Key Exports / Main Units

- Default async page component:
  - `PublicBookingPage({ params })`
- Uses:
  - `notFound`
  - `Pill`, `Surface` UI components
  - `getPublicBookingPage`
  - `formatDateOnly`, `formatDateTime`, `minutesToLabel`

## How It Works

Execution steps:

- `params` is awaited (async route params shape).
- `getPublicBookingPage(profileSlug, eventSlug)` is called.
- If no event/page is found, `notFound()` is triggered.
- Otherwise UI renders:
  - event details,
  - host, duration, timezone policy, location and cancellation-notice hours (lines 31-44),
  - slot tiles from `page.slots`, formatted in `page.eventType.timezone` (`:75-98`).

The badge "Auto-detected zone: America/Los_Angeles" (`:70`) is hard-coded text; nothing detects the viewer's zone. The slot tiles are `type="button"` with no handler, so booking still has to go through `POST /api/bookings`.

No booking mutation happens here; actions are only represented by static button text.

## How It Connects To Other Files

- `src/lib/demo-data.ts` -> `getPublicBookingPage`.
- `src/lib/availability.ts` -> generates slots during data resolution.
- `src/lib/utils.ts` -> formatting helpers.
- `src/app/book/[profileSlug]/[eventSlug]/page.tsx` is the route that `notFound` fallback and error boundaries are designed around.

## Important Design Choices

- Data is resolved server-side inside the page function.
- Route params are treated as identity keys for read access.
- UX renders available slots but does not yet implement booking submission.

## Things A Junior Dev Should Notice

- `profileSlug` + `slug` is the critical identity pair.
- The page trusts service return shape and does not validate slot intervals.
- `notFound()` depends on service returning `null` and assumes publish state.

## Code Review Lens

Focus points:

- Does every required identity combination return clear errors for missing event?
- Are timezone values used consistently in both metadata and slot formatting?
- Does rendering stay resilient when slots are empty?

Common issues:

- Assuming slot button click submits data when backend action is missing.
- Missing guard when service returns malformed attendee or event fields.
- Hardcoding timezone label text that may drift from actual data.

## Common Change Scenarios

- Add booking submit handler:
  - New route call likely needed to `POST /api/bookings`.
- Add locale-aware formatting:
  - Update formatting utilities and every booking-related page.
- Add availability fallback message:
  - Improve empty-slot UX and maintain test coverage.

Before editing, inspect:

- API create route for payload contract.
- Domain types for event timing fields.

## Suggested Exercises

- Trace one valid and one missing slug through `getPublicBookingPage`.
- Add a placeholder "no slots available" state with clear CTA.
- Compare this page's rendering assumptions against a real persisted event.

## Observed Facts vs Inference

Observed:
- This page is read-only and currently does not call a booking creation endpoint.

Inference:
- The UI is a scaffold for a full guest booking flow and intentionally omits submission integration.
