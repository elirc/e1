# `src/app/api/bookings/[bookingId]/cancel/route.ts`

## What This File Is For

This API route handles booking cancellation by booking ID (`POST /api/bookings/{bookingId}/cancel`).

It is a state-transition route with no view rendering and no additional side effects yet.

## Why This File Matters

It shows how lifecycle mutations are represented in the API layer and how domain service errors map to HTTP responses.

This is a high-signal example of:

- param parsing from dynamic route segments
- action-oriented route naming
- error surface in nested resources

## Key Exports / Main Units

- `POST(request, context)`
- Uses request body type:
  - `reason?: string`
- Delegates to `cancelBooking(bookingId, reason)`
- Returns:
  - success via `respond`
  - failure via `problem(..., 404, ...)`

## How It Works

- Reads `bookingId` from `context.params`.
- Parses JSON body with default `{}`.
- Calls service cancellation with reason fallback `"Canceled"`.
- Converts thrown errors to `404` with message fallback.

The route does not check who is allowed to cancel; it relies on service input and service data model.

## How It Connects To Other Files

- Uses `cancelBooking` from `src/lib/mock-services.ts`.
- Uses response helpers from `src/lib/http.ts`.
- Closely paired with:
  - confirm route
  - reschedule route
  - booking detail API

## Important Design Choices

- Mutation endpoint returns updated booking object, not event payload.
- No pre-validation of reason length/content.
- `404` is used for both missing booking and service-level failure states in current implementation.

## Things A Junior Dev Should Notice

- Optional cancellation reason is accepted but not required by request schema.
- A generic default reason can hide real audit quality.
- Route is action style (`/cancel`) rather than pure `PATCH /booking/{id}`.

## Code Review Lens

Review points:

- Should this return `401/403` when actor is unauthorized (once auth exists)?
- Is `404` or `409` more appropriate for invalid transitions?
- Is cancellation reason required for policy compliance?

Common misses:

- No request validation for reason.
- Missing state transition compatibility checks at this layer.
- No notifications or side effects despite likely business requirement.

## Common Change Scenarios

- Add explicit cancellation policy:
  - Validate allowed by event settings and time windows before service call.
- Add audit logging:
  - Extend service result with actor and reason metadata.
- Add idempotency:
  - Treat repeated cancel calls predictably for already canceled bookings.

Before editing, inspect:

- `src/lib/booking-state.ts`,
- `src/lib/demo-data.ts` transitions and status snapshots,
- other booking mutation routes.

## Suggested Exercises

- Trace status changes in this route from booking to canceled and note how state restrictions apply.
- Propose a response schema suitable for webhook consumers.
- Decide when a canceled booking should become readonly in dashboard UI.

## Observed Facts vs Inference

Observed:
- The route is action-style and minimal.
- Service returns are not authenticated or authorized in this layer.

Inference:
- This route expects future middleware and permission checks to be added before production.
