# `src/app/api/event-types/[eventTypeId]/route.ts`

## What This File Is For

This route file handles event type operations for a single event type ID:

- `GET`
- `PATCH`
- `DELETE`

It is a representative mutable API entry point in the product domain.

## Why This File Matters

Event types drive booking behavior (`duration`, `timezone`, `buffers`, `slug`, publication settings).

This file demonstrates:

- per-resource route params
- read/write/delete handler separation
- direct service delegation

## Key Exports / Main Units

- `GET(request, context)`
- `PATCH(request, context)`
- `DELETE(request, context)`
- Context shape:
  - `params: Promise<{ eventTypeId: string }>`

## How It Works

- `GET`:
  - resolves route param
  - calls `getEventType`
  - returns `404` if not found
  - returns event payload on success
- `PATCH`:
  - parses JSON body with fallback
  - calls `updateEventType`
  - returns updated object
- `DELETE`:
  - returns `{ id, deletedAt }` with current timestamp

No DB deletion occurs; delete is a delete-like response placeholder.

## How It Connects To Other Files

- Service boundary:
  - `getEventType`, `updateEventType` from `src/lib/mock-services.ts`.
- Response helper from `src/lib/http.ts`.
- Related publish/unpublish endpoints update the same domain via `updateEventType`.

## Important Design Choices

- Shared ID-based route context in context param style.
- Light schema validation (`Record<string, unknown>` on patch input).
- Soft-delete placeholder pattern instead of destructive operation.

## Things A Junior Dev Should Notice

- `PATCH` and `DELETE` trust runtime shape and may pass unknown fields.
- `DELETE` does not currently toggle status of linked snapshots in this mock layer.
- `GET` and `update` behaviors can diverge if mock data is updated elsewhere.

## Code Review Lens

Focus:

- Is `eventTypeId` ownership/permissions considered anywhere else?
- Can `PATCH` accept unexpected fields that break downstream assumptions?
- Are deleted state markers consistent with dashboard views and route availability?

Common misses:

- Missing schema validation can accept invalid patch payloads.
- No idempotency guidance for repeated patch calls.
- Non-existent event type path errors handled in one branch only.

## Common Change Scenarios

- Add a proper `deletedAt` soft-delete:
  - Update service layer and list queries to filter deleted records.
- Add publish/unpublish controls directly here:
- Ensure API contract and side effects stay consistent.
- Add validation schema:
  - Keep unknown keys rejected and nested objects checked.

Before editing, inspect:

- `src/lib/mock-services.ts` update logic.
- Related publish/unpublish route files.
- UI event-type editor assumptions.

## Suggested Exercises

- Compare this route with `/api/event-types/route.ts` to map list/create vs item operations.
- Add a request example that patches timezone and verify dependent UI views.
- Trace publish flow from event-type route to public page behavior.

## Observed Facts vs Inference

Observed:
- `DELETE` returns a synthetic soft-delete-like response.
- No auth is applied for resource access.

Inference:
- This endpoint is intentionally scaffolded to demonstrate structure while delegating real persistence and permission enforcement.
