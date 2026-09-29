# `src/app/api/bookings/route.ts`

## What This File Is For

This is the main booking creation API endpoint (`POST /api/bookings`).

It performs input parsing, optional anti-abuse limiting, service delegation, and standardized response formatting.

## Why This File Matters

This route is the write boundary from public flow into domain state.

For onboarding, it shows a compact pattern:

- read headers
- apply guard policy
- parse JSON
- call service
- map success/failure to response format

## Key Exports / Main Units

- `POST(request: NextRequest)`
- Rate-limit keying:
  - `create-booking:${ip}`
- Error handling:
  - `problem(..., 429, ...)` for limit
  - `problem(..., 409, ...)` for booking conflict/domain errors

## How It Works

Request handling:

- Reads `x-forwarded-for` and defaults to `local`.
- Calls `rateLimit` with limit 12 / 60 seconds.
- Parses request body with a permissive fallback to `{}`.
- Calls `createBooking(...)`.
- On success returns `201` and metadata `{ booked: true, remaining }`.
- On failure returns `409` with message from thrown error.

## How It Connects To Other Files

- Uses `createBooking` from `src/lib/mock-services.ts`.
- Uses `respond` and `problem` from `src/lib/http.ts`.
- Uses `rateLimit` from `src/lib/rate-limit.ts`.
- Feeds into frontend calls (not yet implemented here) and potentially notification workflows.

## Important Design Choices

- Simple and fast route skeleton with service delegation.
- Per-route fixed-rate limit and simple in-memory bucket implementation.
- Uses conflict status `409` for business rule failures.

## Things A Junior Dev Should Notice

- No explicit schema validation; missing fields are tolerated and handled internally.
- `ip` header is used directly for keying without normalizing multi-proxy chains.
- Domain-level conflicts are surfaced through error handling instead of result enums.

## Code Review Lens

Focus:

- Is conflict handling using the right status code and message for product expectations?
- Is the body validation sufficient for required fields (`eventTypeId`, `startTime`)?
- Is rate limiting enough and safe across deployment topologies?

Common misses:

- Assuming this alone prevents duplicate bookings under concurrent requests.
- Returning generic errors and hiding actionable validation hints.
- Hardcoding status codes that make client retry behavior impossible to reason about.

## Common Change Scenarios

- Add strict request validation:
  - Add parser/validator before calling `createBooking`.
- Add idempotency keys:
  - Accept a client-provided key and persist dedupe state outside this file.
- Add auth checks:
  - Insert authorization gate before service call and before responding.

Before editing, inspect:

- `src/lib/mock-services.ts#createBooking`,
- `src/lib/rate-limit.ts`,
- client forms that call this endpoint.

## Suggested Exercises

- Trace this route to confirm where overlap detection actually lives.
- Replace `x-forwarded-for` with a safer request identifier strategy.
- Add a conflict unit case for concurrent booking attempts in your preferred test shape.

## Observed Facts vs Inference

Observed:
- Request guard and response consistency are handled in-route and in shared helpers.
- No authentication is enforced here.

Inference:
- This route is intentionally a skeleton for future production checks and persistence-safe transaction boundaries.
