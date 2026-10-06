# `src/app/api/bookings/route.ts`

## What This File Is For

`POST /api/bookings` — the public endpoint that creates a booking. It is the write boundary from the guest flow into retained booking state.

## How It Works

1. Builds a rate-limit key from the raw `x-forwarded-for` header, defaulting to `"local"`, and allows 12 requests per 60 seconds per key (lines 8-9). Over the limit → `429` (`:11-13`).
2. Parses the JSON body, falling back to `{}` if the body is not valid JSON (`:15`). The type annotation on the result is only a cast; nothing is validated here.
3. Calls `createBooking(body)` (`:25`), which is `bookingService.create` from `src/lib/booking-service.ts:60-81`. That function does all validation (400), event lookup (404) and availability/conflict checks (409), and stores the booking and attendee in the repository.
4. Success → `201` with `{ data: { booking, attendee }, meta: { correlationId, booked: true, remaining } }` (`:23-28`).
5. Failure → `bookingFailure(error)` returns the `BookingError`'s status and message, or `500` with a generic message for anything unexpected (`:29-32`).

## How It Connects To Other Files

- `src/lib/mock-services.ts:132` → `src/lib/booking-service.ts` → `src/lib/availability.ts` and `src/lib/booking-repository.ts`.
- `src/lib/http.ts` for the `{ data, meta }` envelope and correlation header.
- `src/lib/rate-limit.ts` for the in-memory counter.
- Covered by `src/tests/booking-flow.test.ts:109-129` (400 for `{}`, 201 for a valid slot). That test needs `next` installed.

## Things A Junior Dev Should Notice

- Status codes are decided in the service, not here. If you add a new failure, throw a `BookingError` with the right status; a plain `Error` becomes a 500 with a generic message.
- The response includes the new `confirmationToken`. That is correct for the guest who just booked, and the reason the token must never appear on any other unauthenticated response.
- `x-forwarded-for` is used verbatim. A client can send any value and get a fresh 12-request budget, and every distinct value adds a never-evicted entry to the limiter's `Map`.
- There is no idempotency key. A client retry after a timeout creates a second booking if the slot is still free — and it won't be, so the retry gets a confusing 409.

## Review Notes

- Do not add validation here that duplicates the service; the service is also called directly by tests and other code.
- Behind a reverse proxy, derive the client address from the hop your own proxy appends, not the full header.

## Exercise

Send the same valid body twice in a scratch test via `createBooking`. Confirm the second call throws `BookingError` with status 409, then sketch what an `Idempotency-Key` header would need to store so the second call returns the first booking instead.
