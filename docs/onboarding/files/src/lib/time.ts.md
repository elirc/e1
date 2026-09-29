# `src/lib/time.ts`

## What This File Is For

This file owns timezone-aware date utilities used by scheduling and slot generation logic.

It is a low-level utility module that converts between local calendar text and UTC timestamps.

## Why This File Matters

Scheduling bugs are usually date/math bugs first. This file directly influences what times users can see and book.

It teaches how to isolate time-zone-sensitive logic from UI rendering and API route handling.

## Key Exports / Main Units

- `addMinutes`
- `parseClockTime`
- `toLocalDateParts`
- `parseIsoDate`
- `localDatePartsToIso`
- `addDaysToLocalDate`
- `weekdayForLocalDate`
- `zonedDateTimeToUtc`

## How It Works

Most helpers are small pure functions:

- `addMinutes`, `parseClockTime`, and format/date converters produce small deterministic outputs.
- `toLocalDateParts` and `weekdayForLocalDate` derive local calendar values from UTC-safe formatters.
- `zonedDateTimeToUtc` is the critical conversion function.
  - It first guesses a UTC timestamp from date + clock time.
  - It measures timezone offset twice and adjusts if the DST offset changed around the target instant.
  - The result is a `Date` representing the correct UTC instant for the local schedule input.

## How It Connects To Other Files

- `src/lib/availability.ts` calls these helpers heavily during slot generation.
- Pages format UTC strings for display with `Intl.DateTimeFormat`.
- Any new calendar or recurrence logic should reuse these helpers first.

## Important Design Choices

- Manual conversion using `Intl.DateTimeFormat` avoids a dependency on `date-fns-tz` or `luxon`, keeping the stack light.
- Re-running offset calculation for DST is a defensive step to avoid naive conversions.
- Local date handling is separated from booking-specific logic, making this file reusable across domains.

## Things A Junior Dev Should Notice

- `weekdayForLocalDate` relies on a UTC-backed date object.
- `zonedDateTimeToUtc` assumes input time is wall-clock local time.
- All formatting and parsing here are string-based, so invalid inputs can produce surprising behavior if unvalidated.

## Code Review Lens

Pay close attention to:

- DST boundary correctness around early March and late October.
- The exact point where local date is interpreted in `toLocalDateParts`.
- Whether route/page layers pass timezone consistently (organizer timezone vs event timezone).

Common failure modes:

- Treating all times as UTC display-only and skipping conversion.
- Ignoring edge offsets when user timezone changes due daylight saving transitions.

## Common Change Scenarios

- Add date-range helper for "nearest weekday start":
  - Add pure function with explicit edge-case tests for end-of-month.
- Change representation from strings to `Date` objects:
- This must be done together with slot and page code because many call sites rely on string output.
- Support 24:00 times:
  - `parseClockTime` currently expects two fields; verify parse and display strategy.

## Suggested Exercises

- Trace one slot from local input to UTC output by following `generateSlots` with a known DST date.
- Add a helper test matrix for `zonedDateTimeToUtc` with at least one DST transition date.
- Compare `parseClockTime` + `addMinutes` behavior for negative or malformed input.

## Observed Facts vs Inference

Observed:
- All conversion helpers are pure and intentionally dependency-light.
- `Intl` is used as the timezone authority.

Inference:
- There is likely a production pain point around DST that will justify stronger tests before shipping.
- If recurring scheduling grows more complex, this file may be the one to become a dedicated temporal domain module.
