# Codebase Map

## What Kind of Application This Is

This repository is a modern Next.js App Router application for a scheduling product. The product shape is similar to Cal.com:

- Owners publish booking pages.
- Guests preview availability and book time.
- Team and admin views manage event types, availability, bookings, and integrations.

Observed from code:

- The app has real UI routes under `src/app/...`.
- It also exposes JSON API routes under `src/app/api/...`.
- Business logic currently runs against in-memory demo data in `src/lib/demo-data.ts`.
- A Prisma schema exists in `prisma/schema.prisma`, which shows the intended long-term persistence model.

Inference / likely intent:

- This repo is a buildable product foundation rather than a fully wired production system.
- The current in-memory services are standing in for a future database, auth system, queue, and integration layer.

## Major Architectural Layers

### 1. Route and UI composition layer

Owned mostly by `src/app/` and `src/components/`.

- Page files compose screens and user flows.
- Shared components such as `DashboardShell` provide consistent layout and navigation.
- Pages currently render server-side data by calling library functions directly.

### 2. API boundary layer

Owned by `src/app/api/`.

- Route handlers translate HTTP requests into service calls.
- They handle request parsing, simple error mapping, and response shaping.
- They are intentionally thin compared with the library layer.

### 3. Domain and service layer

Owned by `src/lib/`.

- `domain.ts` defines the core nouns.
- `booking-state.ts` defines status transition rules.
- `availability.ts` and `time.ts` implement scheduling logic.
- `mock-services.ts` coordinates higher-level operations such as booking creation.

This is the most important layer for understanding product behavior.

### 4. Persistence contract layer

Owned by `prisma/schema.prisma`.

- The schema shows what the real data model is supposed to become.
- It captures intended relations, indexes, unique constraints, and soft-delete conventions.
- It matters even though runtime code does not use Prisma yet.

### 5. Cross-cutting request plumbing

Owned by `src/proxy.ts`, `src/lib/http.ts`, and `src/lib/rate-limit.ts`.

- `proxy.ts` injects a correlation ID into requests.
- `http.ts` standardizes JSON responses.
- `rate-limit.ts` adds lightweight request throttling for booking endpoints.

## Major Runtime Boundaries

These boundaries are where data changes shape or where bugs often hide.

### UI boundary

- Browser requests a page.
- A page component calls into `src/lib/...` helpers.
- The result is rendered into HTML.

### HTTP API boundary

- JSON request enters a route handler.
- The route handler extracts params and body values.
- It calls a service function and converts thrown errors into HTTP responses.

### Domain logic boundary

- Raw booking, availability, and integration data is turned into product behavior.
- This is where invariants such as “confirmed bookings cannot overlap” or “canceled bookings need a reason” should live.

### Timezone boundary

- Human scheduling rules are local-time concepts.
- The app converts them into UTC slot windows and then back into display time.
- This is a classic bug hotspot.

### Persistence boundary

- The schema expects durable records, relations, unique constraints, and indexes.
- The current runtime uses in-memory arrays instead, so there is a conceptual gap between “current implementation” and “target architecture.”

### External system boundary

Observed from code:

- Calendar providers, email, SMS, Redis, and Postgres are modeled but not truly integrated yet.

Inference / likely intent:

- Future implementations will replace the current mocks with adapters to OAuth providers, databases, caches, and background workers.

## Important Directories

### `src/app`

Owns route entry points.

- Page routes define user-facing screens.
- API routes define server-side HTTP handlers.
- This directory is where a junior dev should start when tracing “what happens when I visit/call X?”

### `src/components`

Owns reusable UI composition pieces.

- The components here are not a full design system.
- They mostly standardize layout and repeated presentation patterns.

### `src/lib`

Owns the core application logic.

- Types, contracts, availability math, booking state transitions, demo data, and service helpers all live here.
- If you are trying to understand behavior rather than appearance, this is the highest-value directory.

### `prisma`

Owns the data model contract.

- This is the clearest place to understand intended entities and relationships.
- It is especially useful when the runtime code is still mocked.

### `docs`

This will own onboarding material and codebase guidance for future contributors.

## How Data Flows Through the App

### Example: public booking page

1. Request hits `src/app/book/[profileSlug]/[eventSlug]/page.tsx`.
2. The page calls `getPublicBookingPage(...)` from `src/lib/demo-data.ts`.
3. That function finds the matching event type and organizer.
4. It calls `generateSlots(...)` in `src/lib/availability.ts`.
5. `generateSlots(...)` uses:
   - weekly rules
   - overrides
   - blocked times
   - active bookings
   - timezone conversion helpers from `src/lib/time.ts`
6. The page renders the resulting slots for the guest.

Why this matters:

- It shows the main read path for scheduling.
- It demonstrates that “availability” is derived data, not a static table.

### Example: create booking API request

1. Request hits `src/app/api/bookings/route.ts`.
2. The handler applies in-memory rate limiting.
3. It parses the JSON request body.
4. It calls `createBooking(...)` in `src/lib/mock-services.ts`.
5. That function:
   - looks up the event type
   - calculates the requested end time
   - checks for conflicts against existing bookings
   - returns a new booking payload if safe
6. The route responds using `respond(...)` or `problem(...)` from `src/lib/http.ts`.

Why this matters:

- It shows the main write path.
- It is the clearest current example of “route handler -> service -> domain rule -> HTTP response.”

## Key Concepts and Invariants

### Booking status transitions are constrained

Observed from code:

- `src/lib/booking-state.ts` explicitly defines allowed transitions.
- Canceling without a reason throws an error.

Why this matters:

- The state machine protects history and keeps downstream behavior predictable.

### Pending and confirmed bookings block time

Observed from code:

- `isBlockingBookingStatus(...)` returns true for `pending` and `confirmed`.
- Slot generation subtracts those bookings from availability.

Why this matters:

- It encodes a product decision: pending holds time.

### Public booking URLs are identified by profile slug plus event slug

Observed from code:

- The public page lookup uses both `profileSlug` and `slug`.
- The Prisma schema also makes `[profileSlug, slug]` unique.

Why this matters:

- Slug rules are not just frontend naming; they are part of routing and data identity.

### Time is treated as UTC at the data level

Observed from code:

- Booking records store ISO timestamps.
- Slot generation converts local schedule rules into UTC dates.
- UI pages format timestamps in specific time zones.

Inference / likely intent:

- This is the repo’s core time-handling philosophy and should remain true after the database is wired in.

### Responses are meant to carry request metadata

Observed from code:

- `proxy.ts` adds a correlation ID header.
- `http.ts` includes that ID in response metadata.

Why this matters:

- This is a small observability pattern that tends to matter a lot in debugging.

## Where a Junior Dev Should Be Careful

- Do not change time logic casually. Local time, UTC, and daylight saving rules interact in non-obvious ways.
- Do not add booking status values or transitions in one place only. The state machine and any blocking logic must stay aligned.
- Do not assume mock services reflect production behavior perfectly. They are educational scaffolding, not final architecture.
- Do not copy-paste route-handler patterns without deciding where validation, authorization, and error semantics should really live.
- Do not trust module-level “current time” patterns in real systems without thinking about staleness and testability.

## Big Picture Risks / Complexity Hotspots

### 1. Timezone and daylight-saving correctness

This is the deepest technical risk in the current implementation.

- Slot generation depends on local-date iteration plus UTC conversion.
- Small mistakes here can produce wrong or duplicate slots.

### 2. Booking concurrency and double-booking prevention

Observed from code:

- Conflict detection exists.
- Rate limiting exists.

Inference / likely intent:

- Real double-booking prevention will need database transactions or distributed locking, not only application-level checks.

### 3. Gap between prototype services and target production architecture

- The Prisma schema suggests a richer, more durable system than the current in-memory implementation.
- A junior dev should be careful not to assume that “what the mock does today” is the final contract.

### 4. Missing auth and RBAC enforcement in runtime code

Observed from code:

- Role types exist in the schema and domain types.
- Route handlers do not currently enforce user identity or permissions.

Why this matters:

- Security-sensitive work will require a sharper boundary than the current prototype has.

## Recommended Mental Model

Think of the codebase in this order:

1. The schema and domain types define the nouns.
2. The service and utility files define the behavior.
3. The route handlers expose that behavior to HTTP.
4. The page files present that behavior to users.

That order is not accidental. It is often the cleanest way to reason about modern application codebases, even when the exact frameworks change.
