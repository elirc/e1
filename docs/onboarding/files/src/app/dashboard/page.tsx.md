# `src/app/dashboard/page.tsx`

## What This File Is For

The owner dashboard at `/dashboard`: four metric cards, a list of upcoming bookings linking to `/dashboard/bookings/{id}`, the event-type list, and integration status. It is a server component that reads one snapshot and renders it; it performs no mutations.

## How It Works

- Calls `getDashboardSnapshot()` from `src/lib/demo-data.ts` once (line 8). Imports are only `DashboardShell`, `MetricCard`/`Pill`/`Surface`, `getDashboardSnapshot` and two formatters from `src/lib/utils.ts`.
- Metric cards (`:16-37`): published event count, `upcomingBookings.length`, connected/total integrations, and `planLimit.activeSeats`.
- Upcoming list (from `:59`): maps `snapshot.upcomingBookings`, taking the first attendee from `snapshot.attendeesByBookingId[booking.id]`.
- Event types and integrations are rendered straight from the snapshot arrays.

Because the root layout sets `dynamic = "force-dynamic"` (`src/app/layout.tsx:1`), each request rebuilds the snapshot from the current repository, so a booking created through the API shows up on the next page load in the same process.

## How It Connects To Other Files

- `src/lib/demo-data.ts` `getDashboardSnapshot` (`:497-530`).
- `src/components/dashboard-shell.tsx` and `src/components/ui.tsx` for layout primitives.
- `src/app/dashboard/bookings/[bookingId]/page.tsx` is the detail page each booking links to.

## Things A Junior Dev Should Notice

- The "Upcoming" card's description says "Bookings in active or pending states", but the snapshot filters by start time only. A canceled booking in the future is still counted and listed.
- There is no authentication on this page or its layout (`src/app/dashboard/layout.tsx` returns `children`). The linked detail page prints the guest's confirmation token (`src/app/dashboard/bookings/[bookingId]/page.tsx:41`).
- Metric descriptions such as "reflected in the conflict engine" describe intent; integrations do not feed `generateSlots` today.

## Exercise

Change the Upcoming metric to count only bookings for which `isBlockingBookingStatus(booking.status)` is true (import it from `src/lib/booking-state.ts`). Decide whether the list below it should use the same filter or show canceled bookings with a badge, and write down why.
