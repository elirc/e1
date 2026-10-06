# `src/proxy.ts`

## What This File Is For

This file is a request middleware-like utility that injects a correlation ID into inbound requests.

It is part of the observability boundary, not business logic.

## Why This File Matters

Correlation IDs are critical for tracing a request through logs, especially when debugging async or multi-step flows.

The file shows how the codebase attempts request-to-response continuity with minimal dependencies.

## Key Exports / Main Units

- `proxy(request: NextRequest)`
- `config.matcher`

## How It Works

Behavior:

- If incoming request already has `x-correlation-id`, middleware passes through.
- Otherwise it creates a new `crypto.randomUUID()`.
- It clones headers and sets `x-correlation-id`.
- It returns `NextResponse.next()` with updated request headers.

`config.matcher` skips static assets and favicon from this middleware path.

## How It Connects To Other Files

- Next.js 16 renamed the middleware convention to `proxy.ts` with an exported `proxy` function; in a project with a `src/` directory it lives at `src/proxy.ts`. So this file is wired in by convention, not by import.
- Complements `src/lib/http.ts`, which reads the same request header (`http.ts:9-10`) and echoes it in `meta.correlationId` and the `x-correlation-id` response header.
- The header is only read by handlers that use `respond`/`problem`; pages ignore it.

## Important Design Choices

- Very small middleware scope.
- Non-blocking behavior: it never rejects, only augments request context.
- Safe header propagation for most dynamic routes.

## Things A Junior Dev Should Notice

- No route imports this function; the framework calls it.
- A client-supplied `x-correlation-id` is passed through untouched (line 5-6), with no length or format check, so it can carry arbitrary text into anything that logs it.
- Route handlers called directly in tests (as in `src/tests/booking-flow.test.ts:109-129`) bypass the proxy, which is why `respond` also generates an ID when the header is missing.

## Code Review Lens

Review focus:

- Is middleware file wired correctly in framework version being used?
- Are IDs preserved across internal redirects/rewrites?
- Is correlation propagation safe for any auth headers?

Common misses:

- Assuming this is active when it is not registered.
- Re-generating IDs at each hop due to incorrect matcher scope.
- Missing log integration for the header.

## Common Change Scenarios

- Add request ID propagation to logs:
  - Use this header inside downstream APIs and background jobs.
- Expand tracing context:
  - Add trace/span fields as the architecture grows.
- Rename header for standards compatibility:
- Ensure route helper and middleware remain consistent.

Before editing, inspect:

- Next.js middleware wiring docs.
- Deploy target and CDN/proxy header rewrite rules.

## Suggested Exercises

- Verify where request IDs appear in responses from a live call.
- Prove by inspection whether this middleware is active in current build setup.
- Add a log line and see how correlation flows end-to-end.

## Observed Facts vs Inference

Observed:
- `proxy.ts` currently contains middleware helper logic and matcher config.

Inference:
- The project may have intended this to be an active middleware but has not guaranteed wiring in route code.
