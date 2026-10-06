# `src/lib/mock-services.ts`

## What This File Is For

This is the facade that route handlers and pages import. It mixes two very different kinds of export:

- **Real booking commands.** `createBooking`, `confirmBooking`, `cancelBooking` and `rescheduleBooking` are the methods of one `createBookingService` instance wired to the shared `bookingRepository` and the seed events, templates, overrides and blocked times (lines 130-135). All validation, authorization and state changes happen in `src/lib/booking-service.ts`.
- **Canned mocks.** Everything else returns fabricated objects and changes nothing.

Knowing which is which is the main thing to learn from this file.

## Key Exports

| Export | Real or canned | Notes |
|---|---|---|
| `createBooking`, `confirmBooking`, `cancelBooking`, `rescheduleBooking` | real | re-exported service methods (`:132-135`) |
| `getBookingDetail(id)`, `getBookingDetailByToken(token)` | real reads | booking + attendees from the repository (`:145-175`); the by-ID variant also adds `eventType` |
| `listUpcomingBookings`, `listPastBookings` | real reads | slices of `getDashboardSnapshot()` (`:137-143`) |
| `getAvailabilityWindow`, `previewSlots` | real reads | wrap `getPublicBookingPage`, defaulting to `jordan-lee` / `strategy-sync` when slugs are missing (`:111-128`) |
| `listEventTypes`, `getEventType` | real reads | seed event types |
| `registerOwner`, `loginOwner` | canned | `loginOwner` returns random tokens for *any* email (`:35-46`) |
| `createTeam`, `inviteMember`, `assignMembershipRole` | canned | |
| `createEventType`, `updateEventType` | canned | `updateEventType` with an unknown ID falls back to the first event type (`:90-97`) |
| `setWeeklyAvailability`, `createAvailabilityOverride` | canned | |
| `connectIntegration`, `refreshIntegration`, `disconnectIntegration` | canned | |
| `getHealthSnapshot` | canned | metrics are hard-coded numbers (`:202-207`) |

## How It Connects To Other Files

- Imported by nearly every handler under `src/app/api/` and by `src/app/dashboard/bookings/[bookingId]/page.tsx`.
- Depends on `src/lib/booking-service.ts` (commands) and `src/lib/demo-data.ts` (repository, seed data, read helpers).

## Things A Junior Dev Should Notice

- The service instance is created once at module load with `events: getEventTypes()`. That is the same array object the seed exports, so it is not a stale copy, but the canned event-type mutators never write to it, so "editing" an event type has no effect on booking.
- `getBookingDetail` and the list functions return whole `Booking` objects, **including `confirmationToken`**. The dashboard API routes that use them are unauthenticated, so the token that guards cancel/reschedule is readable by anyone. See `astraupskill/06-SOLUTIONS-AND-REVIEW.md` finding 1.
- Because the canned functions return plausible-looking objects with 200 status, an API client cannot tell a no-op from a real change.

## Review Notes

- Any new read helper that returns bookings to an owner surface should strip the token.
- A canned function should not invent success for an unknown ID; returning `null` (→ 404) is more honest than `updateEventType`'s fallback.
- New booking commands belong in `booking-service.ts`, not here, so they run inside a repository transaction and through `authorize`.

## Exercise

Make a two-column list of every `src/app/api/**/route.ts` file and whether the function it calls is real or canned. Then check how many canned endpoints are listed in `src/lib/api-manifest.ts` as if they were working features.
