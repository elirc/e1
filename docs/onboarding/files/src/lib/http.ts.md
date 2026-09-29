# `src/lib/http.ts`

## What This File Is For

This file provides shared HTTP response helpers for App Router route handlers.

It normalizes success and error payload shape and carries request metadata (correlation ID) across responses.

## Why This File Matters

Consistent API envelopes make debugging and client consumption easier across many routes.

This file is where juniors can learn the pattern: keep transport glue thin and reusable.

## Key Exports / Main Units

- `respond(request, data, init?, meta?)`
- `problem(request, status, message, meta?)`

## How It Works

- `respond` builds `NextResponse.json` with:
  - `data` as the payload body
  - `meta` object including `correlationId` and any route-supplied metadata
  - an `x-correlation-id` response header.
- If request header lacks correlation ID, `respond` generates one.
- `problem` is a wrapper that calls `respond` with `{error: message}` and an `ok: false` metadata flag.

## How It Connects To Other Files

- Imported by almost every route in `src/app/api/*`.
- Works with `src/proxy.ts` when that header is already injected.
- Route-specific metadata can be passed through to API consumers through the `meta` parameter.

## Important Design Choices

- Shared envelope shape over ad-hoc JSON structures.
- Correlation metadata at both body and header level.
- Uses `Request` header as metadata input, avoiding global context.

## Things A Junior Dev Should Notice

- Body shape is uniform (`{ data, meta }`) for success and structured `problem` shape for errors.
- HTTP status is controlled by helper callers via `init`.
- Meta can carry useful debugging clues such as `booked`, `remaining`, or `documented`.

## Code Review Lens

Review focus:

- Are all routes using this helper instead of custom response JSON?
- Are errors always represented through `problem` where appropriate?
- Is correlation metadata present and consistent on failures?

Common misses:

- Returning raw arrays from routes while most routes use wrappers.
- Failing to include useful status code for validation vs conflict paths.
- Inconsistency in `meta` meaning (`ok` flag and extra fields).

## Common Change Scenarios

- Add pagination metadata:
  - Extend `respond` type contract and then update route callers that need `meta` pagination fields.
- Add trace IDs:
  - Ensure middleware and proxy flow sets header before handlers if needed.
- Standardize error payload beyond `error` string:
  - Update `problem` contract with a structured error type.

Before editing, inspect:

- API handlers that still return custom shapes.
- Frontend clients expecting current payload format.

## Suggested Exercises

- Convert one route to use `problem` where it currently returns plain object.
- List all fields currently present in `meta` across API routes.
- Explain the difference between header-based and body-based observability signals.

## Observed Facts vs Inference

Observed:
- This helper is used broadly and intentionally centralizes API response structure.

Inference:
- As number of clients grows, this file is likely to evolve into a richer API contract layer with error codes.
