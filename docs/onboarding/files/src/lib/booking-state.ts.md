# `src/lib/booking-state.ts`

## What This File Is For

This file is the booking state machine. It centralizes allowed transitions and transition behavior for booking statuses.

It is a domain service and policy file, not a data access file.

## Why This File Matters

State transitions are one of the highest-risk parts of booking products.

This file prevents invalid state jumps (for example, completing a draft) and enforces required metadata for specific changes.

## Key Exports / Main Units

- `canTransitionBooking(currentStatus, nextStatus)`
- `isBlockingBookingStatus(status)`
- `transitionBooking(booking, nextStatus, reason?)`

## How It Works

- `canTransitionBooking` checks allowed destination states from a static map:
  - `draft -> pending | confirmed | canceled`
  - `pending -> confirmed | canceled`
  - `confirmed -> completed | canceled | no_show`
  - and so on.
- `isBlockingBookingStatus` returns `true` for `pending` and `confirmed`.
- `transitionBooking`:
  - Validates transition via `canTransitionBooking`.
  - Requires a `reason` when moving to `canceled`.
  - Returns a new booking object with updated status and `updatedAt`.
  - Clears `cancellationReason` when moving to non-canceled states.

## How It Connects To Other Files

- Called from `src/lib/mock-services.ts` (`confirmBooking`, `cancelBooking`, `rescheduleBooking`).
- Influences `src/lib/availability.ts` through `isBlockingBookingStatus`.
- Indirectly affects UI rendering of active/inactive states.

## Important Design Choices

- The transition map is explicit and inspectable.
- Error messages are thrown immediately rather than returning soft error objects.
- Cancellation reason is enforced in the domain layer, not only in UI.

## Things A Junior Dev Should Notice

- `no_show` can transition only to `canceled` in this version.
- `transitionBooking` mutates by replacement and updates timestamps but does not persist.
- `canceled` as terminal state except no-show recovery means cancellation history is important in callers.

## Code Review Lens

Focus points:

- Are transition edges changed consistently in both this file and caller logic?
- Is every call site providing a cancellation reason when required?
- Is any caller bypassing this state machine and directly mutating status?

Common bugs:

- Missing reason validation in custom routes that manually set status.
- Assuming `pending` is safe and non-blocking.
- Forgetting that return value is a new object, not an in-place mutation.

## Common Change Scenarios

- Add a new terminal status:
  - Update transition map and ensure service callers handle the new status in UI and filters.
- Make `draft` skippable in public confirmation flow:
  - Update both domain map and API handlers expecting conflict checks.
- Add audit metadata on each transition:
  - Inspect where booking events are persisted later.

Before editing, inspect:

- `src/lib/mock-services.ts`,
- `src/app/api/bookings/*/route.ts`,
- dashboard components that derive behavior from status.

## Suggested Exercises

- Draw the state graph from the map and mark which states are blocking.
- Propose a safe update that allows `completed -> canceled` and list likely business impacts.
- Add a hypothetical rule: `pending` should auto-expire after 24h, and identify where to enforce it.

## Observed Facts vs Inference

Observed:
- Valid transitions and cancellation reason requirement are strictly enforced in `transitionBooking`.
- Blocking statuses are currently only `pending` and `confirmed`.

Inference:
- This is intended as a minimal policy core that future production code should treat as single source of truth for status semantics.
