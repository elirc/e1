# A booking that remains booked

The scheduling demo originally returned convincing booking objects without retaining them. A successful create response could be followed by a detail lookup that found nothing, while slot previews continued offering the same time. Cancellation and rescheduling had similar gaps. This course follows the replacement: a shared process-local repository, explicit command validation, organizer-wide availability, guest tokens and atomic replacement of a booking.

Start with the codebase map, then inspect the repository excerpt below. `read` returns a clone rather than the mutable internal arrays. `transaction` makes a working copy, invokes a synchronous callback, clones its result and only then replaces retained state. A callback that throws cannot publish its draft. This gives the demonstration a useful atomicity boundary within one JavaScript process. It does not provide database persistence, crash recovery or synchronization between server instances.

The seed contains illustrative people, calendars, event types and bookings. New booking tokens use random UUIDs; the three seeded bookings use readable tokens (`tok_upcoming_1`, `tok_upcoming_2`, `tok_past_1` in `src/lib/demo-data.ts`). Registration, login, event editing and integration commands still return canned response shapes from `src/lib/mock-services.ts`. No external calendar, email account or OAuth provider participates in these tests.

## Running the checks

The test command is `npm test`, which runs:

```
node --loader ./scripts/alias-loader.mjs --experimental-strip-types --test src/tests/*.test.ts
```

`scripts/alias-loader.mjs` maps `@/...` imports to `src/...`, and Node strips the TypeScript types at load time. Everything under `src/lib/` except `http.ts` imports nothing outside the repo, so 17 of the 18 tests run on a fresh clone with **no `npm install`**. The last test (`src/tests/booking-flow.test.ts:109`) imports `next/server` to build real `NextRequest` objects and fails with `ERR_MODULE_NOT_FOUND` until dependencies are installed. `npm run typecheck`, `npm run lint` and the build also need the installed packages; the recorded results are in [VERIFICATION](VERIFICATION.md).

Read the failed-request tests as carefully as the success test. The important contract is that a rejected reschedule leaves both the original booking and its attendee linkage unchanged (`src/tests/booking-flow.test.ts:69-80`).

## How the chapters fit together

| Chapter | What you get |
|---|---|
| [01-CODEBASE-MAP](01-CODEBASE-MAP.md) | The four layers of the booking path and a file:line table for each hop |
| [02-CONCEPTS](02-CONCEPTS.md) | Availability, authority and atomicity as three separate guarantees |
| [03-WORKED-CHANGE](03-WORKED-CHANGE.md) | The reschedule rewrite, line by line, against the original snapshot |
| [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) | How the 18 tests are built and how to localize a failure |
| [05-PRACTICE](05-PRACTICE.md) | Six exercises with runnable `node --test` checks (no install) |
| [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) | Solution code for every check plus a senior review of what is still weak |
| [07-TRACE-LAB](07-TRACE-LAB.md) | A step-by-step trace of one failed and one successful reschedule |
| [VERIFICATION](VERIFICATION.md) | Recorded command evidence and the limits of what it proves |

The `snapshots/` directory keeps the pre-fix versions of the files this course changed (for example `snapshots/src__lib__mock-services.ts.original.txt`). Diffing a snapshot against the live file is the fastest way to see what the fix pass actually did.

## Source excerpt

From [src/lib/booking-repository.ts](../src/lib/booking-repository.ts) (lines 6-22).

```ts
export function createBookingRepository(seed: BookingState) {
  const original = structuredClone(seed);
  let state = structuredClone(original);
  return {
    read: (): BookingState => structuredClone(state),
    reset: () => { state = structuredClone(original); },
    transaction<T>(work: (draft: BookingState) => T): T {
      const draft = structuredClone(state);
      const result = work(draft);
      if (result && typeof result === "object" && "then" in result) {
        throw new Error("Booking transactions must be synchronous.");
      }
      const output = structuredClone(result);
      state = structuredClone(draft);
      return output;
    },
  };
}
```

Notice the order inside `transaction`: the async guard and the result clone both run *before* `state` is reassigned. Anything that throws up to that line leaves the stored graph exactly as it was.

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
