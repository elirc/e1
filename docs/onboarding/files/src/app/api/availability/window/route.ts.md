# `src/app/api/availability/window/route.ts`

## What This File Is For

This is the availability-window read API endpoint (`GET /api/availability/window`).

It resolves a public availability context by profile/event slug and returns a full page-like payload for that event.

## Why This File Matters

This route shows another boundary for exposing availability context without creating state.

It is useful for clients that want data for previews, checks, or embedded widgets.

## Key Exports / Main Units

- `GET(request: NextRequest)`
- Query params:
  - `profileSlug`
  - `eventSlug`

## How It Works

- Reads `profileSlug` and `eventSlug` from search params.
- Calls `getAvailabilityWindow(...)` from services.
- If no page found, responds with `404`.
- On success, responds with normalized data from `respond`.

## How It Connects To Other Files

- Uses `getAvailabilityWindow` from `src/lib/mock-services.ts`.
- Uses shared response utilities from `src/lib/http.ts`.
- Pairs closely with preview and public page loaders that use identical lookup keys.

## Important Design Choices

- Very thin handler with a clear HTTP semantic (`404` for unknown identity).
- No separate schema validation for query params.
- Reuses common response wrappers for consistency.

## Things A Junior Dev Should Notice

- This endpoint and preview endpoint share similar inputs but different helper functions.
- It does not apply rate limits, unlike preview and create endpoints.
- It trusts service defaults when search params are missing.

## Code Review Lens

Focus:

- Should this endpoint be protected from discovery of private events?
- Are missing params correctly rejected or defaulted?
- Is this route sufficiently aligned with `/api/bookings/preview` behavior?

Common misses:

- Query tampering because `profileSlug` and `eventSlug` are not validated.
- Missing cache or memoization for repeated reads.
- Error payload shape drift from other not-found routes.

## Common Change Scenarios

- Add stronger identity validation:
  - check published state and team visibility in service layer.
- Add rate limiting:
  - mirror create/preview anti-abuse strategy.
- Add pagination/window range params:
  - expand service to support custom date windows.

Before editing, inspect:

- `src/lib/mock-services.ts#getAvailabilityWindow`,
- public booking page route for identity semantics.

## Suggested Exercises

- Compare this endpoint against `/api/bookings/preview` using the same slugs.
- Add one missing-slug request and trace 404 handling across API and UI.
- Check if the returned payload has enough shape for a client widget.

## Observed Facts vs Inference

Observed:
- This endpoint currently delegates completely to service lookup logic.
- No explicit auth or rate guard is present.

Inference:
- Intended as an internal public data retrieval helper with lower write risk, but still likely needs throttling in production.
