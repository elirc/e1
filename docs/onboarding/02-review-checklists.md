# Review Checklists

These checklists are tailored to this repository, but they are written to stay useful in similar modern application codebases.

## Business Logic / Services

Files in this repo:

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

- A status transition becomes technically allowed but semantically wrong.
- A reschedule path cancels the old booking but forgets to validate the replacement.
- “Current time” is captured too early and becomes stale in long-lived server processes.

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

- Parsing JSON with permissive defaults can hide missing required fields.
- Dynamic route params may be trusted without checking tenancy or ownership.
- Rate limiting can be applied to create routes but forgotten on preview routes.

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
- A booking token is unique in schema but regenerated inconsistently in services.
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

Subtle bugs a junior dev might miss:

- A conflict check compares only exact overlap and ignores buffers.
- Pending bookings block time in one code path but not another.
- A rate limit keyed by `x-forwarded-for` can behave strangely behind proxies.

## Auth / Permissions / Security-Sensitive Paths

Observed from code:

- Role concepts exist in the domain and schema.
- Runtime route handlers currently do not enforce authentication or RBAC.

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

Observed from code:

- There is no true realtime subsystem yet.
- Webhook routes and notification models suggest future event-driven behavior.

What to look for in similar changes:

- Is event emission idempotent?
- Is retry behavior safe?
- Does event ordering matter?

Common failure modes:

- Duplicate notifications
- stale sync updates overwriting fresher state
- missing audit events for important transitions

Good questions to ask:

- What happens if this event is delivered twice?
- What is the source of truth when callbacks disagree?
- Is there enough context in the event payload to debug failures later?

Subtle bugs a junior dev might miss:

- An integration refresh path updates status but not last-sync metadata.
- A webhook acknowledges success before its side effects are durable.

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

- A helper adds headers in success responses but not error responses.
- A thrown error bypasses the normal response envelope.

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

- The repo currently verifies with lint and build.
- There is no real automated test suite yet.

What to look for:

- Does the change touch time logic, conflict detection, or lifecycle rules?
- Does the change affect public/private boundaries or multi-tenant behavior?
- Does the change alter schema assumptions?

High-value missing tests in this repo:

- booking conflict detection with buffers
- status transition rules
- cancellation requires a reason
- public booking lookup by `profileSlug + slug`
- daylight-saving edge cases in slot generation
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
