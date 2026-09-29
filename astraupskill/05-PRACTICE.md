# Exercises with observable outcomes

Exercise one: create two event types owned by the same organizer, with a thirty-minute meeting starting at 10:00. Give the first event a thirty-minute trailing buffer and the second a fifteen-minute leading buffer. Predict whether 11:00 and 11:30 should be offered for the second event, then prove the result with the public service. Explain which two occupied intervals overlap. Keep a control case for a different organizer.

Exercise two: extend the command tests with an unknown booking, a valid ID paired with a wrong token, and a correct token paired with guestCanReschedule set to false. Assert the intended status for each case and compare repository state with a snapshot taken before the command. A test that checks only that something threw is insufficient: it can pass for an unrelated configuration error.

Exercise three: inspect the repository transaction callback. Deliberately remove a booking from the draft and then throw. Confirm the stored booking and attendee remain. Next mutate an object returned by read and verify a later read remains unchanged. These are different forms of isolation: rollback protects failed work, while cloning protects the boundary from callers holding references.

Exercise four: query a half-hour schedule with rangeStart at 09:07, then add a duplicate available window. The first start must remain 09:30 and each instant must appear once. Try zero, negative and nonfinite intervals; each must fail quickly instead of entering an unbounded loop. Preserve the distinction between a programming/configuration error and a legitimate empty slot list.

Exercise five: design a persistent implementation on paper. Identify the database constraints and transaction isolation needed to prevent competing organizer bookings, and decide how a provider calendar update would be retried. Do not remove the documented process-local limitation merely because the in-memory tests pass. External side effects need their own recovery model and evidence.

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
