# `src/lib/availability.ts`

## What This File Is For

This file calculates public and owner-facing booking slots from scheduling rules, overrides, blocks, and existing bookings.

It is the core availability engine in the current codebase.

## Why This File Matters

If slot generation is wrong, everything around it (UI, booking API, user trust) is wrong. This is the most execution-critical shared algorithm outside state transitions.

## Key Exports / Main Units

- `generateSlots(params)`

## How It Works

Inputs include:

- `eventType`
- `template`
- `overrides`
- `blockedTimes`
- `bookings`
- `rangeStart`
- `rangeEnd`

The function:

- Converts `rangeStart` and `rangeEnd` into local date parts using template timezone.
- Builds candidate windows from weekly rules for each day in range.
- Applies overrides for matching dates:
  - `available` merges additional windows.
  - `unavailable` subtracts windows.
- Builds blockers from:
  - blocked calendar ranges
  - confirmed/pending bookings expanded by booking/event buffers
- Subtracts blockers from windows, clips by requested range, then emits fixed-size slots based on event duration and slot interval.
- Applies minimum notice (`minNoticeMinutes`) and future window (`maxDaysInFuture`) filters.
- Sorts and caps output to 24 slots.

## How It Connects To Other Files

- Called from `src/lib/demo-data.ts` for public page preparation.
- Called from API preview endpoints through service wrappers.
- Relies on domain constants from `src/lib/domain.ts` and status policy from `src/lib/booking-state.ts`.
- Uses timezone conversion from `src/lib/time.ts`.

## Important Design Choices

- Uses pure helper functions over raw database query-based availability logic.
- Handles overrides as additive or subtractive operations rather than separate precedence tables.
- Caps result list to 24 slots to keep API payloads small and predictable.
- Converts blocking bookings by adding event buffers at slot-check time.

## Things A Junior Dev Should Notice

- Override application and booking blockers happen at the same algorithmic stage; ordering matters.
- `maxDaysInFuture` filtering is enforced by `rangeEnd` and `now` checks, not by event type route config.
- A slot is considered invalid if it violates notice, even when it appears in weekly windows.
- The function allocates windows as plain UTC date ranges but iterates in local-day buckets.

## Code Review Lens

Review focus:

- Are all constraints from `EventType` applied exactly once and consistently?
- Do all blocker sources respect buffer semantics?
- Is the day-iteration upper bound correct when start/end cross DST changes?

Common failure modes:

- Forgetting to apply cancellation/confirmation policy before adding booking blockers.
- Missing override precedence causing double-subtraction or missing merge.
- Producing too many slots and leaking unavailable windows to clients.

## Common Change Scenarios

- Add a booking buffer from global team policy:
  - Update booking blocker construction and confirm whether route-level previews enforce same buffers.
- Add availability step sizes based on event-specific preferences:
  - Ensure `slotIntervalMinutes` still aligns with buffer and duration math.
- Add blocked-time source from external calendars:
  - Add it into `blockedTimes` and keep unit shape compatible with `zonedDateTimeToUtc`.

Before editing, inspect:

- `src/lib/mock-services.ts` callers,
- `src/lib/time.ts`,
- and route handlers that return these slots.

## Suggested Exercises

- Pick one date and manually compute windows and blockers for a single event type.
- Trace why a slot is rejected at `minimumStart` or `maximumStart` checks.
- Swap override order to see how "available then unavailable" behaves differently.

## Observed Facts vs Inference

Observed:
- Availability is calculated purely in application code from in-memory inputs.
- Blocking logic uses both calendar blocks and booking status checks.

Inference:
- This implementation is likely to be moved to a persisted precompute or indexed query strategy in production.
