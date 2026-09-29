# Evidence and operating limits

The evidence section below records the completed commands accepted for this delivery, their exit codes and project-local logs. The test total counts assertions grouped by the runner as tests; it does not count shell commands as tests. Read the complete test summary and require zero failures, skips and cancellations. A command that is still running is not accepted evidence.

The finite suite exercises direct commands, shared demo consumers, cloned return values, transaction rollback, invalid input, organizer conflicts, both event buffers, notice and horizon rules, terminal states, token permissions, attendee linkage and actual HTTP status mapping. Type checking and linting catch a different class of defects. A production build verifies framework compilation and route generation, while the dynamic root layout prevents a build snapshot from becoming the retained booking view.

These checks do not establish production durability. Storage is process-local and resets with the process. Multiple workers or hosts can disagree because there is no shared database or distributed lock. Login, registration, owner administration and integration actions remain a simulator. Seed tokens are illustrative; new tokens are random. The tests make no claim that a real OAuth connection, notification delivery or external calendar synchronization occurred.

Timezone conversion uses the project's existing local-date helpers. Deterministic regression cases use UTC. This delivery does not certify every daylight-saving gap, fold, timezone database version or overnight availability convention. Such support needs explicit product rules and targeted tests before stronger claims are made.

Keep the original snapshots when experimenting. They provide an exact baseline for reviewing why behavior changed. Run the relevant checks after source edits and replace the recorded evidence only with a terminal passing result. The course and report describe the implemented scope and its remaining operational limits so the next reader can distinguish a complete teaching flow from a deployed scheduling service.

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)

## Recorded command evidence

The full suite passed **18 tests**. Counts refer to tests, not commands.

| Check | Exact command arguments | Exit | Evidence |
|---|---|---:|---|
| `resume14-tests-02` | `["npm.cmd", "test"]` | 0 | [record](evidence/resume14-tests-02.json), [log](evidence/resume14-tests-02.log) |
| `resume14-types-01` | `["npm.cmd", "run", "typecheck"]` | 0 | [record](evidence/resume14-types-01.json), [log](evidence/resume14-types-01.log) |
| `resume14-lint-01` | `["npm.cmd", "run", "lint"]` | 0 | [record](evidence/resume14-lint-01.json), [log](evidence/resume14-lint-01.log) |
| `resume14-build-01` | `["npm.cmd", "run", "build", "--", "--webpack"]` | 0 | [record](evidence/resume14-build-01.json), [log](evidence/resume14-build-01.log) |
