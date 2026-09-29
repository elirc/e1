# `src/lib/rate-limit.ts`

## What This File Is For

This file provides a lightweight in-memory request rate limiter.

It is a temporary production-protection mechanism for hot routes like booking preview and creation.

## Why This File Matters

Even in a prototype, rate limiting affects abuse behavior and accidental denial patterns.

It also reveals where concurrency and distributed deployment assumptions are currently not yet enforced.

## Key Exports / Main Units

- `rateLimit(key, maxRequests, windowMs)`

## How It Works

`rateLimit` keeps a `Map` keyed by string identifier (usually derived from IP).

Each key has:

- `count`: number of seen requests in current window
- `resetAt`: millisecond expiry for that bucket

Algorithm:

- If no bucket exists or it has expired:
  - initialize bucket with `count=1` and `resetAt=now+windowMs`.
- If `count >= maxRequests`:
  - reject request with `allowed=false`.
- Else increment count and return `allowed=true`.

Return value includes `remaining` allowance for the current window.

## How It Connects To Other Files

- Used by:
  - `src/app/api/bookings/route.ts`
  - `src/app/api/bookings/preview/route.ts`
- Called with keys like `create-booking:${ip}` and `preview:${ip}`.
- Fits within API boundary and response helpers in `src/lib/http.ts`.

## Important Design Choices

- Module-level memory map for state.
- Windowed counter model instead of token bucket.
- No persistence or shared storage.

## Things A Junior Dev Should Notice

- Rate key source is `x-forwarded-for`, which can be proxy-dependent.
- The implementation is per-server instance and resets on process restart.
- Return `remaining` is not used by all consumers, but may be useful for future headers.

## Code Review Lens

Review focus:

- Are the route keys stable and not easy to spoof?
- Are limits high enough for normal user behavior but still protective?
- Is denial behavior transparent (status + error messaging)?

Common misses:

- Applying limits only to POST endpoints and forgetting heavy GET endpoints.
- Returning stale buckets across deployments.
- Not handling missing IP header gracefully in multi-proxy setups.

## Common Change Scenarios

- Make limits configurable:
  - Parameterize keys and caps by route and env variables.
- Add Redis-backed limiter:
  - Replace map with shared store and add unit/integration fallback.
- Add consistent `retry-after` semantics:
  - Extend return value and wire it into `problem` responses.

Before editing, inspect:

- API routes calling this helper.
- Deployment topology and proxy headers.

## Suggested Exercises

- Trace what happens if two different requests share `x-forwarded-for`.
- Evaluate current limits for realistic traffic patterns.
- Propose a test case for window boundary behavior.

## Observed Facts vs Inference

Observed:
- Implementation is intentionally minimal and in-process.

Inference:
- This is a prototype guard and not safe for production multi-instance deployments yet.
