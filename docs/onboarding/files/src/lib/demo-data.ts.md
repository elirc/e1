# `src/lib/demo-data.ts`

## What This File Is For

This file holds the seed data and the read helpers that pages and services use. Since the September fix pass it has two kinds of state:

- **Static seed arrays** for users, accounts, memberships, the team, event types, availability templates, overrides, blocked times, integrations, audit log and plan limit. Their getters return the module-level arrays directly.
- **Booking state** (bookings and attendees) lives in a `bookingRepository` created from the seed bookings and attendees (lines 473-475). `getBookings()` and `getBookingAttendees()` return fresh clones from `bookingRepository.read()` (`:477-483`).

## How It Works

- `now`, `isoNow` and `isoFromNow(minutes)` (`:22-27`) are computed once at module load, so seed booking times are relative to process start. The three seed bookings have readable tokens (`tok_upcoming_1`, `tok_upcoming_2`, `tok_past_1`).
- The repository is stored on `globalThis.e1BookingRepository` with `??=`, so a module reload in the same process reuses the existing state instead of reseeding.
- `getDashboardSnapshot()` (`:497-530`) takes a fresh `new Date()` and splits bookings into upcoming (`startTime >= now`) and past by **start time only**, then builds an attendee map. It calls `getBookings()` twice and `getBookingAttendees()` once, i.e. three full clones per call.
- `getPublicBookingPage(profileSlug, eventSlug)` (`:532-584`) finds a published, non-deleted event by both slugs, finds its organizer and template, and calls `generateSlots` over `[now, now + maxDaysInFuture days]` with that organizer's overrides, blocked times and current bookings.
- `getBookingById` and `getBookingByToken` (`:586-592`) search the cloned bookings.

## How It Connects To Other Files

- `src/lib/booking-repository.ts` provides the store; `src/lib/booking-service.ts` (via `mock-services.ts`) writes to the same `bookingRepository`.
- Pages call `getDashboardSnapshot` and `getPublicBookingPage` directly (`src/app/dashboard/page.tsx`, `src/app/book/[profileSlug]/[eventSlug]/page.tsx`).
- `src/lib/availability.ts` computes the slots.

## Things A Junior Dev Should Notice

- Static getters still return shared array references. Mutating `getEventTypes()[0]` changes it for every caller, including the booking service. Tests avoid this by `structuredClone`-ing before editing (`src/tests/booking-flow.test.ts:13`).
- Booking getters return clones. Mutating a returned booking does nothing; that is intentional.
- "Upcoming" includes canceled and other non-blocking bookings whose start is in the future. The dashboard labels that count as active/pending.
- The public page picks the organizer's template without checking `deletedAt` (`:547-549`), while the booking service requires a non-deleted template. The two can disagree.

## Review Notes

- Any new booking read must go through `getBookings()` / the repository, never the module-level `bookings` array, or it will miss new and changed bookings.
- Returning full `Booking` objects from snapshot helpers exposes `confirmationToken` to every consumer.

## Exercise

Call `getDashboardSnapshot()` in a scratch test, cancel one upcoming booking with its token via `cancelBooking`, and call it again. Predict `upcomingBookings.length` before you run it. Reset with `bookingRepository.reset()` in a `finally`.
