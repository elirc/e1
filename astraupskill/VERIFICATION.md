# Evidence and operating limits

The evidence section below records the completed commands accepted for this delivery and their exit codes. The test total counts tests as reported by the runner; it does not count shell commands as tests. Read the complete test summary and require zero failures, skips and cancellations. A command that is still running is not accepted evidence.

The finite suite exercises direct commands, shared demo consumers, cloned return values, transaction rollback, invalid input, organizer conflicts, both event buffers, notice and horizon rules, terminal states, token permissions, attendee linkage and actual HTTP status mapping ([04](04-TESTING-AND-DEBUGGING.md#what-each-test-proves) maps each test to its line range). Type checking and linting catch a different class of defects. A production build verifies framework compilation and route generation, while the dynamic root layout prevents a build snapshot from becoming the retained booking view.

These checks do not establish production durability. Storage is process-local and resets with the process. Multiple workers or hosts can disagree because there is no shared database or distributed lock. Login, registration, owner administration and integration actions remain a simulator, and owner-facing routes have no authentication at all (see [06, finding 1](06-SOLUTIONS-AND-REVIEW.md#1-guest-tokens-are-readable-by-anyone-high)). Seed tokens are illustrative; new tokens are random. The tests make no claim that a real OAuth connection, notification delivery or external calendar synchronization occurred.

Timezone conversion uses the project's existing local-date helpers. Deterministic regression cases use UTC. This delivery does not certify every daylight-saving gap, fold, timezone database version or overnight availability convention. Such support needs explicit product rules and targeted tests before stronger claims are made.

Keep the original snapshots when experimenting. They provide an exact baseline for reviewing why behavior changed. Run the relevant checks after source edits and replace the recorded evidence only with a terminal passing result.

## Recorded command evidence

Recorded 2026-09-19. The full suite passed **18 tests**. Counts refer to tests, not commands.

| Check | Exact command arguments | Exit | Evidence |
|---|---|---:|---|
| `resume14-tests-02` | `["npm.cmd", "test"]` | 0 | [record](evidence/resume14-tests-02.json) |
| `resume14-types-01` | `["npm.cmd", "run", "typecheck"]` | 0 | [record](evidence/resume14-types-01.json) |
| `resume14-lint-01` | `["npm.cmd", "run", "lint"]` | 0 | [record](evidence/resume14-lint-01.json) |
| `resume14-build-01` | `["npm.cmd", "run", "build", "--", "--webpack"]` | 0 | [record](evidence/resume14-build-01.json) |

Each JSON record names a `.log` file (for example `"log": "resume14-tests-02.log"`), but the log files were never committed to this repository; only the four JSON records are. The `cwd` field in the records is the machine path where the commands originally ran, not a path in this repo.

**Status note (2026-10-06).** Re-checked on a fresh clone with no `node_modules`: `npm test`'s underlying command reported 18 tests, 17 passing; the one failure is the HTTP-handler test (`src/tests/booking-flow.test.ts:109`), which needs the `next` package and passes only after `npm install`. Typecheck, lint and build were not re-run (they require installed dependencies). The practice checks in [06](06-SOLUTIONS-AND-REVIEW.md) were run the same way: 6 of 6 passed.

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
