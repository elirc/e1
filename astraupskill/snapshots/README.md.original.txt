# Pulseboard Scheduler

Pulseboard Scheduler is a dependency-light Next.js foundation for a Cal.com-style scheduling SaaS. It ships with:

- A public booking flow at `/book/[profileSlug]/[eventSlug]`
- Owner dashboard surfaces for event types, availability, team settings, and booking detail
- Typed App Router API endpoints for auth, teams, event types, availability, bookings, integrations, dashboard data, and webhooks
- A booking state machine and slot generator that account for recurring hours, overrides, buffers, and active conflicts
- A draft Prisma schema and Docker Compose setup for the target Postgres + Redis architecture

## Local setup

1. Copy `.env.example` to `.env.local`
2. Start infrastructure with `docker compose up -d`
3. Run `npm run dev`

## Key routes

- `/`
- `/dashboard`
- `/dashboard/event-types`
- `/dashboard/availability`
- `/dashboard/team`
- `/dashboard/bookings/book_upcoming_1`
- `/book/jordan-lee/strategy-sync`
- `/api/docs`

## Architecture notes

- Times are modeled in UTC at the data layer and rendered in a viewer timezone.
- Booking transitions are restricted by `src/lib/booking-state.ts`.
- Slot previews are generated from `src/lib/availability.ts`.
- Demo data lives in `src/lib/demo-data.ts` so the UI and APIs stay in sync.
- Request correlation IDs are attached via `src/proxy.ts`.

## What this foundation covers

- Auth endpoints: register, login, logout, refresh
- Team endpoints: create team, invite member, role assignment, settings
- Event type endpoints: CRUD plus publish and unpublish
- Availability endpoints: weekly rules, overrides, window previews
- Booking endpoints: preview, create, confirm, cancel, reschedule, fetch by token
- Integration endpoints: Google connect, Microsoft 365 connect, refresh, disconnect
- Dashboard endpoints: upcoming, past, booking detail
- Webhook endpoints: calendar callbacks and booking event fanout

## Current scope

This repository currently uses seeded in-memory data to keep the product surface coherent without blocking on package installation or external services. The Prisma schema, env file, and Docker Compose config are included so the next step can be wiring persistent storage, OAuth flows, queue workers, and notification delivery.
