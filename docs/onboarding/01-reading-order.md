# Reading Order

This is a staged path for a junior developer. The goal is not to read every file immediately. The goal is to build the right mental model in the right order.

## Stage 1: Learn the nouns before the flows

Read:

1. `prisma/schema.prisma`
2. `src/lib/domain.ts`
3. `src/lib/api-manifest.ts`

Why this stage comes first:

- You need to know what the system talks about before you can understand behavior.
- The schema and domain file tell you which concepts are first-class: users, teams, event types, availability, bookings, attendees, integrations, notifications, and audit logs.
- The API manifest shows which product capabilities the app intends to expose.

What to learn:

- Core entities and how they relate
- Which IDs and uniqueness rules matter
- Which concepts are currently runtime contracts versus future persistence contracts

Checkpoint:

After this stage, you should understand:

- what the product does at a high level
- what the main entities are
- which parts of the system are public-facing versus internal

## Stage 2: Learn where the app gets its data today

Read:

1. `src/lib/demo-data.ts`
2. `src/lib/mock-services.ts`

Why this stage comes next:

- The repository currently runs on in-memory data.
- These files are the best bridge between the abstract model and the current application behavior.

What to learn:

- How demo records are shaped
- Which helpers are pure lookups versus higher-level operations
- How the app currently fakes persistence, identity, and external systems

Checkpoint:

After this stage, you should understand:

- where pages and APIs are actually getting their data
- why some behavior feels “real” even though the app is not fully integrated yet
- which service functions are likely placeholders for future adapters

## Stage 3: Learn the scheduling rules

Read:

1. `src/lib/booking-state.ts`
2. `src/lib/time.ts`
3. `src/lib/availability.ts`

Why this stage comes before pages and APIs:

- These files contain the logic that is easiest to break and hardest to reason about.
- If you read the UI first, you may understand the screens but miss the real complexity.

What to learn:

- booking lifecycle invariants
- what “blocking” means
- how local availability windows turn into UTC slots
- where daylight-saving and notice-window bugs could appear

Checkpoint:

After this stage, you should understand:

- why scheduling systems are mostly time-and-state problems
- which functions are algorithmic rather than just structural
- why correctness here matters more than presentation polish

## Stage 4: Learn the main user-facing entry points

Read:

1. `src/app/page.tsx`
2. `src/components/dashboard-shell.tsx`
3. `src/app/dashboard/page.tsx`
4. `src/app/book/[profileSlug]/[eventSlug]/page.tsx`

Why this stage comes now:

- Once you understand the domain and logic, the UI becomes much easier to read.
- These files show how the app presents the underlying model to different audiences.

What to learn:

- how pages compose data from library helpers
- how shared layout and repeated patterns are organized
- how the same domain concepts appear differently in marketing, owner, and guest views

Checkpoint:

After this stage, you should understand:

- the difference between composition code and domain logic
- how a public booking experience differs from an internal dashboard
- which page files are mostly presentation and which ones imply meaningful data dependencies

## Stage 5: Learn the API boundary

Read:

1. `src/lib/http.ts`
2. `src/lib/rate-limit.ts`
3. `src/proxy.ts`
4. `src/app/api/bookings/preview/route.ts`
5. `src/app/api/bookings/route.ts`
6. `src/app/api/event-types/[eventTypeId]/route.ts`
7. `src/app/api/availability/window/route.ts`

Why this stage comes after pages:

- The route handlers make more sense once you already know the domain and UI flows they serve.
- These files show the architectural seam between HTTP transport and business logic.

What to learn:

- how request metadata is added
- how response envelopes are standardized
- where rate limiting lives
- how thin route handlers delegate to services

Checkpoint:

After this stage, you should understand:

- how one request moves from HTTP into domain code and back
- which logic belongs in route handlers versus library modules
- which parts of the API layer are solid patterns and which are still prototype shortcuts

## Suggested Tracing Exercises

### Exercise 1: Trace one guest booking read path

Start at `src/app/book/[profileSlug]/[eventSlug]/page.tsx`.

Trace:

1. page params
2. `getPublicBookingPage(...)`
3. `generateSlots(...)`
4. `zonedDateTimeToUtc(...)`

Goal:

- Understand how human scheduling rules become rendered slots.

### Exercise 2: Trace one booking write path

Start at `src/app/api/bookings/route.ts`.

Trace:

1. request body parsing
2. rate limiting
3. `createBooking(...)`
4. conflict detection against existing bookings
5. response formatting

Goal:

- Understand where correctness checks happen today and where a production system would need stronger guarantees.

### Exercise 3: Trace one state rule through the stack

Start at `src/lib/booking-state.ts`.

Trace:

1. allowed transitions
2. blocking statuses
3. where route handlers or services rely on those rules

Goal:

- Build the habit of treating lifecycle rules as shared system invariants, not UI-only concepts.

### Exercise 4: Trace one contract from schema to UI

Start at `prisma/schema.prisma` and follow `EventType`.

Trace:

1. schema definition
2. runtime shape in `src/lib/domain.ts`
3. seeded instance in `src/lib/demo-data.ts`
4. rendering in dashboard and public page files

Goal:

- Learn how the same concept appears at different architectural levels.

## How to Read Productively

- Read entry points and helpers side by side. Do not read only pages or only services.
- Write down invariants as you notice them. Examples: “canceled bookings need a reason” or “public event lookup uses two slugs.”
- Mark each observation as either “seen directly in code” or “likely intended architecture.”
- When you feel confused, trace one real example rather than reading another file at random.

## What Not to Do

- Do not start with every API route. Many are thin wrappers and will not teach much until you know the shared patterns.
- Do not spend too long on styling details before you understand the scheduling logic.
- Do not assume the mock-service layer is the final architecture.

The right question is not “What does every file do?” The right question is “Which files explain how the system thinks?”
