# Review Checklists

These checklists are tailored to this repository. Where a known weakness already exists, it is cited with file:line so you can recognize the pattern; the full write-up is in `astraupskill/06-SOLUTIONS-AND-REVIEW.md`.

## Business Logic / Services

Files in this repo:

- `src/lib/booking-service.ts`
- `src/lib/booking-repository.ts`
- `src/lib/mock-services.ts`
- `src/lib/availability.ts`
- `src/lib/booking-state.ts`
- `src/lib/time.ts`

What to look for:

- Is the important business rule in the service layer, or is it accidentally duplicated in a route or page?
- Do functions preserve domain invariants such as valid booking transitions and non-overlapping bookings?
- Are “read helpers” and “write helpers” clearly separated?

Common failure modes:

- A service quietly stops enforcing a rule because the check moved to the UI.
- Time calculations mix local assumptions with UTC values.
- A refactor updates booking creation but forgets slot preview behavior.

Good questions to ask:

- If this logic were called from another route, would the same invariant still hold?
- Is this function returning derived state or mutating source-of-truth state?
- Are conflicts and status transitions checked in one central place?

Subtle bugs a junior dev might miss:

- A status transition becomes technically allowed but semantically wrong. Example in this repo: reschedule hard-codes the replacement to `confirmed` even when the source was `pending` (`booking-service.ts:108`).
- A reschedule path cancels the old booking but forgets to validate the replacement. (The original snapshot did exactly this; the current code preflights with `offered` first.)
- “Current time” is sampled more than once in one command. `reschedule` samples once (`booking-service.ts:105`); `confirm` samples twice (`:86`, `:88`).
- A new read helper reads the seed arrays instead of `bookingRepository.read()`, so it never sees new bookings.

## API Routes / Controllers

Files in this repo:

- `src/app/api/...`
- `src/lib/http.ts`

What to look for:

- Is the route handler thin and predictable?
- Are request parsing, validation, and error handling explicit?
- Does the response shape remain consistent?

Common failure modes:

- Returning raw values in one route and wrapped values in another
- Missing HTTP status codes for conflict or not-found cases
- Treating malformed input the same as a business conflict

Good questions to ask:

- What are the expected failure categories here: invalid input, missing record, permission failure, conflict, system failure?
- Is this route the right place for this logic?
- Does the route leak implementation details that should stay in the service layer?

Subtle bugs a junior dev might miss:

- Parsing JSON with permissive defaults can hide missing required fields. `POST /api/bookings` falls back to `{}` (`src/app/api/bookings/route.ts:15`) and relies on the service to return 400; the confirm/cancel/reschedule routes reject non-objects themselves (line 12 of each).
- Dynamic route params may be trusted without checking tenancy or ownership. `GET /api/dashboard/bookings/[bookingId]` returns any booking, token included.
- A canned handler returns success for an unknown ID. `PATCH /api/event-types/[eventTypeId]` falls back to the first event type (`mock-services.ts:90-97`).
- Rate limiting is applied to create and preview but not to `availability/window`, confirm, cancel or reschedule.

## Database Schema and Persistence Logic

Files in this repo:

- `prisma/schema.prisma`

What to look for:

- Are unique constraints aligned with application identity rules?
- Do indexes support likely query patterns?
- Are soft-delete conventions applied consistently?
- Do relations and `onDelete` behaviors match business intent?

Common failure modes:

- The app assumes uniqueness that the schema does not enforce.
- A relation cascades deletes that should have preserved history.
- Soft-deleted rows are indexed but not filtered consistently.

Good questions to ask:

- What query will this index accelerate?
- What historical data must survive cancellation or cleanup?
- Is this field nullable because the business wants it optional, or because the implementation is incomplete?

Subtle bugs a junior dev might miss:

- `profileSlug + slug` uniqueness exists in schema but a runtime lookup uses only one part.
- `confirmationToken` is `@unique` in the schema; the service generates a fresh UUID on create and on reschedule (`booking-service.ts:74`, `:109`). Keep it that way in any new command.
- The schema indexes `[organizerId, startTime]` but has no constraint preventing overlapping bookings. The in-memory transaction is the only protection today.
- A schema supports RBAC concepts that route handlers do not yet enforce.

## Frontend State and UI Behavior

Files in this repo:

- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/book/[profileSlug]/[eventSlug]/page.tsx`
- `src/components/dashboard-shell.tsx`

What to look for:

- Does the UI make the correct domain assumptions?
- Are pages composing existing logic, or reimplementing it?
- Do states like “not found,” “no slots,” and “rate limited” have explicit handling?

Common failure modes:

- UI renders a happy path but ignores empty or error states.
- A page assumes data exists because demo data always returns something.
- Business logic leaks into markup loops and becomes hard to reuse or test.

Good questions to ask:

- If the backing data changes shape, where does this page break first?
- Is this component primarily layout, or is it quietly becoming a business-logic container?
- Are we rendering viewer-local time or organizer-local time, and is that intentional?

Subtle bugs a junior dev might miss:

- A public page says “auto-detected zone” but still renders another zone’s data.
- A dashboard view uses presentational labels that can drift from real status semantics.
- A route param mismatch can accidentally call `notFound()` for valid but unpublished resources.

## Async Code / Concurrency / Race Conditions

Files in this repo:

- booking APIs
- slot generation and booking creation
- rate limiting

What to look for:

- Does a write path depend on reading shared state and then writing later?
- Is there any real atomicity guarantee?
- Are multiple requests likely to observe stale state?

Common failure modes:

- Two requests pass conflict checks before either one commits.
- A memory-based rate limit behaves differently across processes or instances.
- Time-sensitive logic calculates “now” at multiple points and gets inconsistent answers.

Good questions to ask:

- What prevents double booking here in production, not just in a single process?
- If two requests hit this code at the same time, what is the worst plausible outcome?
- Does this algorithm assume single-instance execution?

Observed from code:

- Booking commands are synchronous callbacks inside `repository.transaction` (`booking-repository.ts:12-21`), so within one process no other command can interleave between the availability check and the write. The repository rejects async callbacks.
- Nothing is shared between processes.

Subtle bugs a junior dev might miss:

- Adding an `await` inside a booking command would break the guarantee above; the repository would throw, but only after the callback started.
- A conflict check compares only exact overlap and ignores buffers. (Current code applies both events' buffers: `availability.ts:146-151`, `:160-164`.)
- Pending bookings block time in one code path but not another.
- A rate limit keyed by raw `x-forwarded-for` (`src/app/api/bookings/route.ts:8`) can be bypassed by sending a new header value, and its `Map` (`src/lib/rate-limit.ts:1`) never evicts keys.

## Auth / Permissions / Security-Sensitive Paths

Observed from code:

- Role concepts exist in the domain and schema.
- No route or page enforces authentication or RBAC; `src/app/dashboard/layout.tsx` just renders its children.
- Guest mutators require the booking's `confirmationToken` (`booking-service.ts:46-54`).
- The token is returned by `GET /api/dashboard/upcoming`, `GET /api/dashboard/past`, `GET /api/dashboard/bookings/[bookingId]`, and printed on `src/app/dashboard/bookings/[bookingId]/page.tsx:41`. Anyone can therefore read a token and cancel someone else's booking.

What to look for:

- Is the route assuming identity without proving it?
- Is team or booking ownership checked before returning or mutating data?
- Are public and private resources clearly separated?

Common failure modes:

- A user can fetch or modify another team’s event type by ID.
- A guest token path exposes more information than intended.
- A route accepts state-changing requests without CSRF or auth boundaries.

Good questions to ask:

- Who is allowed to call this route?
- What resource ownership check should happen here?
- Is this identifier safe to expose publicly?

Subtle bugs a junior dev might miss:

- Using a globally unique ID can feel safe while still leaking cross-tenant data.
- “Public booking page” logic can get reused in a private admin context and bypass stronger checks.
- Correlation IDs improve debugging but are not security controls.

## Realtime or Event-Driven Code

There is no realtime subsystem. `src/app/api/webhooks/bookings/route.ts` and `src/app/api/webhooks/calendar/route.ts` exist, and the schema has a `Notification` model, but no command emits events or notifications. When that changes, ask: is emission idempotent, and does the webhook acknowledge only after its side effects are durable?

## Error Handling and Observability

Files in this repo:

- `src/proxy.ts`
- `src/lib/http.ts`

What to look for:

- Are errors categorized well enough for operators and developers?
- Is the correlation ID preserved?
- Are responses consistent enough to debug distributed flows later?

Common failure modes:

- Returning a generic 500 for a predictable business conflict
- swallowing useful error messages
- inconsistent metadata between routes

Good questions to ask:

- If this fails in production, what would we need to identify the request?
- Is the status code telling the truth about what went wrong?
- Are we preserving enough context without leaking sensitive data?

Subtle bugs a junior dev might miss:

- `respond` echoes a client-supplied `x-correlation-id` unvalidated (`src/lib/http.ts:9-10`).
- A thrown error bypasses the normal response envelope. Routes that do not wrap their service call in `try`/`bookingFailure` will surface as a framework 500.

## Types, Contracts, and Validation

Files in this repo:

- `src/lib/domain.ts`
- route handlers that cast request bodies

What to look for:

- Are types carrying real meaning, or are they just labels?
- Is there runtime validation to match the TypeScript contracts?
- Are public API shapes stable and explicit?

Common failure modes:

- TypeScript says a field is optional, but business logic assumes it exists.
- Route handlers cast request bodies without validation.
- Schema, domain types, and runtime payloads drift apart.

Good questions to ask:

- Which types are external contracts versus internal convenience types?
- What protects us if a client sends malformed JSON?
- Does this change require coordinated edits in schema, types, services, and UI?

Subtle bugs a junior dev might miss:

- `Record<string, unknown>` bodies can hide missing required fields.
- A schema enum grows but a UI or service switch statement does not.

## Tests and Missing Test Coverage

Observed from code:

- `src/tests/booking-flow.test.ts` has 18 tests run by `npm test` (Node's test runner with type stripping and `scripts/alias-loader.mjs`).
- Seventeen run with no `npm install`; the HTTP-handler test needs `next`.

What to look for:

- Does the change touch time logic, conflict detection, or lifecycle rules?
- Does the change affect public/private boundaries or multi-tenant behavior?
- Does the change alter schema assumptions?

Already covered: buffer-aware organizer conflicts, transition rules, blank cancel reason, token checks, transactional rollback, slot-grid anchoring.

High-value missing tests in this repo:

- no read surface returns `confirmationToken` to an unauthenticated caller
- dashboard counts after a status change (canceled bookings currently stay in `upcomingBookings`, `demo-data.ts:499-501`)
- public booking lookup by `profileSlug + slug`, including an unpublished event
- daylight-saving edge cases in slot generation (every fixture uses UTC)
- rate limiting behavior on booking endpoints

Good questions to ask:

- What is the smallest test that would catch the likely regression?
- Is this logic pure enough to unit test directly?
- If this were persisted in a real DB, what concurrency test would we want?

Subtle bugs a junior dev might miss:

- A change “works in the UI” but breaks the API contract.
- A refactor preserves the happy path but changes conflict semantics.

## A Good Review Habit for This Repo

For any non-trivial change, ask yourself:

1. Which invariant might this weaken?
2. Which architectural boundary is this crossing?
3. Which similar code path now needs to stay in sync?
4. What would fail first if two requests race?
5. What test would make me confident this is safe?

That habit is more valuable than memorizing any single checklist item.
