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

- Intended to be used as a Next.js middleware entry point.
- Complements `src/lib/http.ts`, which reads the same correlation header for response metadata.
- If configured, all API and page routes can share consistent correlation IDs.

## Important Design Choices

- Very small middleware scope.
- Non-blocking behavior: it never rejects, only augments request context.
- Safe header propagation for most dynamic routes.

## Things A Junior Dev Should Notice

- This file is in `src`, so a proper default middleware export name/placement might be needed by framework conventions.
- There is no direct import of this function in route files.
- The behavior is safe only if middleware is actually wired in the app runtime.

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
