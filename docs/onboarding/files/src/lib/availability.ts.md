# `src/lib/availability.ts`

## What This File Is For

`generateSlots(params)` is the availability engine. It answers "which start times can be offered for this event type in this range?" Both the public booking page and the booking service use it, so the slots a guest sees and the slots the service accepts come from the same function.

## How It Works

Inputs: `eventType`, `template`, `overrides`, `blockedTimes`, `bookings`, `rangeStart`, `rangeEnd`, and optionally `now`, `limit` (default 24) and `eventTypes`.

1. **Guard** (lines 86-95). Throws `RangeError` unless duration, interval and horizon are positive safe integers, buffers and notice are non-negative safe integers, duration ≤ 1440, horizon ≤ 366 days, all dates are valid, the range is non-empty and ≤ 367 days, and `limit` (if given) is a positive integer. This is what stops a zero interval from looping forever.
2. **Day loop** (`:100-112`). Converts `rangeStart`/`rangeEnd` to local dates in the *template's* timezone and iterates each local day.
3. **Windows** (`:116-141`). Materializes that weekday's ranges to UTC (`materializeRangesForDate` validates `HH:MM` and start < end). Overrides for the same organizer and date are applied in order: `available` appends windows, `unavailable` subtracts them.
4. **Blockers** (`:143-152`). The organizer's blocked times, plus every booking for the same organizer that is not soft-deleted and has a blocking status (`pending`/`confirmed`). Each booking is widened by *its own* event type's buffers, looked up in `params.eventTypes`; if not found, the candidate event's buffers are used.
5. **Candidates** (`:155-168`). For each window, a cursor starts at `window.start` and steps by `slotIntervalMinutes`. A candidate is skipped if it falls outside `[rangeStart, rangeEnd]`, before `now + minNotice`, after `now + maxDaysInFuture`, or was already emitted (a `Set` dedupes overlapping windows). Then the candidate is widened by its own buffers and skipped if it strictly overlaps any blocker.
6. **Output** (`:171-173`). Sorted by start and sliced to `limit`.

Blockers are **not** subtracted from the windows. Windows define the grid; blockers only filter candidates. That is why booking at 10:00 does not shift later slots off the half-hour.

## How It Connects To Other Files

- `src/lib/demo-data.ts` `getPublicBookingPage` — public page, `/api/bookings/preview`, `/api/availability/window`.
- `src/lib/booking-service.ts` `offered` (`:31-45`) — calls it with a one-slot range and `limit: 1` to validate a requested start time.
- `src/lib/booking-state.ts` `isBlockingBookingStatus`; `src/lib/time.ts` for timezone conversion.

## Things A Junior Dev Should Notice

- Grid anchoring is deliberate: a range starting at 09:07 still yields 09:30 as the first half-hour slot (`src/tests/booking-flow.test.ts:99-106`).
- The returned `timezone` on each slot is `eventType.timezone`, but windows are computed in `template.timezone`. They are the same in the seed; nothing enforces that.
- The blocker list is rebuilt inside the day loop and every slot in the horizon is generated before the 24-slot slice. Fine at seed size; O(days × bookings) at scale.
- Every test fixture uses UTC, so daylight-saving behavior here is untested.

## Exercise

With the test fixture from `src/tests/booking-flow.test.ts:12-23`, add an `unavailable` override for 12:00-13:00 on 2026-09-21 and confirm with `generateSlots` that 12:00 and 12:30 disappear while 11:30 and 13:00 remain.
