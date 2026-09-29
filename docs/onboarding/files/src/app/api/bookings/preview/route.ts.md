# `src/app/api/bookings/preview/route.ts`

## What This File Is For

This is the read-only booking preview endpoint (`GET /api/bookings/preview`).

It exposes available slots without creating a booking and applies request-level rate limiting.

## Why This File Matters

Preview endpoints are where users get fast feedback before writing data, so this file teaches safe "read-first" API behavior and parameter-driven service delegation.

## Key Exports / Main Units

- `GET(request: NextRequest)`
- Query params:
  - `profileSlug`
  - `eventSlug`
- Rate limit key: `preview:${ip}`

## How It Works

- Extracts `x-forwarded-for` or defaults to `local`.
- Applies rate limit of 40 requests per minute.
- Reads optional query params.
- Returns slot preview results from `previewSlots`.
- Returns 429 if rate limit is exceeded.

Unlike create flow, there is no body parsing here, only query parameter handling.

## How It Connects To Other Files

- Delegates to `previewSlots` in `src/lib/mock-services.ts`.
- Uses shared response helpers in `src/lib/http.ts`.
- Shares rate-limit behavior from `src/lib/rate-limit.ts`.
- Works with same identity fields as public page rendering (`profileSlug` and `eventSlug`).

## Important Design Choices

- Rate limit higher than create endpoint, matching intended read traffic.
- Stateless GET endpoint with minimal branching.
- `undefined` query params are supported and delegated to service defaults.

## Things A Junior Dev Should Notice

- No strict query validation is done here.
- Rejection reason is generic.
- This endpoint's output shape depends on seed data and may differ from production filtering.

## Code Review Lens

Focus on:

- Query parameter handling (missing/invalid values).
- Whether previews and create checks share same constraints.
- Whether rate limiting should differ per user, per IP, or both.

Common misses:

- High limits encouraging brute-force slot scraping.
- Inconsistent constraints between preview and create endpoints.
- Returning preview data for unpublished or inaccessible events.

## Common Change Scenarios

- Add start/end filters:
  - Update query parsing and service signature.
- Add per-user quota:
  - Extend key strategy with optional auth token.
- Add cache headers:
  - Ensure idempotency and response freshness expectations.

Before editing, inspect:

- `src/lib/mock-services.ts#previewSlots`,
- `src/lib/availability.ts`.

## Suggested Exercises

- Compare this route and `/api/bookings` constraints for the same request shape.
- Add a test case for missing event slug using default preview behavior.
- Measure whether this endpoint leaks unpublished public pages.

## Observed Facts vs Inference

Observed:
- This route is read-only and intentionally thin.
- It uses query defaults via `undefined` passthrough.

Inference:
- In a production deployment, this route likely needs stronger anti-abuse and caching.
