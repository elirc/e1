# `src/app/api/bookings/[bookingId]/cancel/route.ts`

## What This File Is For

`POST /api/bookings/{bookingId}/cancel` — a guest cancels a booking using the confirmation token they received when booking. The confirm and reschedule routes in the sibling folders have the same shape.

## How It Works

1. Awaits `context.params` for `bookingId` (line 10). Route params are a `Promise` in this Next.js version.
2. Parses the body; if it is not a JSON object (bad JSON, `null`, an array, a primitive), returns `400 "A JSON object is required."` (`:11-12`).
3. Calls `cancelBooking(bookingId, body.reason, body.confirmationToken)` (`:14`), i.e. `bookingService.cancel` in `src/lib/booking-service.ts:93-100`. Inside one repository transaction it:
   - runs `authorize` with action `"cancel"`: unknown or soft-deleted booking → 404; missing/wrong token → 403; `guestCanCancel === false` → 403;
   - requires a non-blank `reason` of at most 1000 characters → otherwise 400;
   - runs `transition(booking, "canceled", ...)`; a terminal status (`canceled`, `completed`) → 409;
   - replaces the booking in the draft.
4. Success → `200` with the updated booking. Failure → `bookingFailure` maps `BookingError` to its status, anything else to a generic 500 (`:15-18`).

## How It Connects To Other Files

- `src/lib/booking-service.ts` (`authorize`, `transition`), `src/lib/booking-state.ts` (transition table and reason rule), `src/lib/booking-repository.ts` (atomic publish).
- After a cancel, the slot reappears in `getPublicBookingPage` because `availability.ts` only blocks `pending`/`confirmed` bookings.
- Tested at `src/tests/booking-flow.test.ts:84-98` (service) and `:123-126` (HTTP: 403 without token, 200 with it, then 409 on confirm).

## Things A Junior Dev Should Notice

- Order of checks: token before reason. A blank reason with a wrong token returns 403, not 400.
- Canceling is not idempotent: a second cancel with the same token returns 409, not 200.
- There is no time-based policy. `EventType.cancellationPolicyHours` exists in the data and is shown on the public page, but nothing enforces it.
- The token check is only as strong as the token's secrecy, and `GET /api/dashboard/upcoming` returns tokens to anyone (see `astraupskill/06-SOLUTIONS-AND-REVIEW.md`).

## Exercise

Add a check to a scratch copy of the service that rejects cancellation within `cancellationPolicyHours` of `startTime` with a 409. Which clock value should it use, and what does the test at `booking-flow.test.ts:26-41` need so it keeps passing?
