# Test the booking contract through actual consumers

The suite uses Node's built-in test runner and a small loader that resolves the project's TypeScript aliases. It invokes real service functions and actual route handlers; no database container is involved because this application's storage boundary is deliberately in memory. Type checking remains a separate command because runtime type stripping does not verify TypeScript types.

The deterministic fixture uses a fixed Monday morning in UTC and creates two published event types for one organizer. Every day has the same business hours. This removes unrelated seed calendar changes from conflict tests. Individual tests create isolated repositories and service instances, allowing buffers, guest flags and clocks to be varied without affecting other cases.

A separate test exercises the default demo graph: create through mock-services, read by ID and token, inspect detail attendees and dashboard entries, check that the offered slot disappears, cancel, then check that it returns. That test resets the shared repository in finally. It is valuable because isolated service tests cannot discover a forgotten static-array read in a page data helper.

The HTTP test creates NextRequest objects and calls POST exports directly. It checks 400 for malformed command fields, 403 for a missing guest token, 404 for an unknown booking and 409 for confirming a canceled booking. It also verifies a successful 201 response from the create route. This does not substitute for a browser test or a deployed multi-process test, but it proves the route-to-service status mapping.

When debugging, first reproduce the smallest failing assertion. A type error belongs to type checking; a loader failure occurs before assertions; an availability rejection needs the clock, event configuration and organizer blockers inspected together. Keep the recorded unsuccessful command logs as history, and use only terminal passing runs as delivery evidence.

## Source excerpt

From [src/tests/booking-flow.test.ts](../src/tests/booking-flow.test.ts).

```ts
test("create, detail, token, dashboard and preview share the actual demo repository", () => {
  bookingRepository.reset();
  try {
    const event = getEventTypes().find(event => event.published)!;
    const slot = getPublicBookingPage(event.profileSlug,event.slug)!.slots[0]; assert.ok(slot);
    const result = createBooking({ eventTypeId:event.id,startTime:slot.startTime,attendeeName:"Integration Guest",attendeeEmail:"flow@example.com" });
    assert.equal(getBookingById(result.booking.id)?.status,"confirmed");
    assert.equal(getBookingByToken(result.booking.confirmationToken)?.id,result.booking.id);
    assert.equal(getBookingDetail(result.booking.id)?.attendees[0].email,"flow@example.com");
    assert.ok(getDashboardSnapshot().upcomingBookings.some(item=>item.id===result.booking.id));
    assert.ok(!getPublicBookingPage(event.profileSlug,event.slug)!.slots.some(item=>item.startTime===slot.startTime));
    cancelBooking(result.booking.id,"Changed plans",result.booking.confirmationToken);
    assert.equal(getBookingById(result.booking.id)?.status,"canceled");
    assert.ok(getPublicBookingPage(event.profileSlug,event.slug)!.slots.some(item=>item.startTime===slot.startTime));
  } finally { bookingRepository.reset(); }
});
```

## Course navigation

[README](README.md) / [01-CODEBASE-MAP](01-CODEBASE-MAP.md) / [02-CONCEPTS](02-CONCEPTS.md) / [03-WORKED-CHANGE](03-WORKED-CHANGE.md) / [04-TESTING-AND-DEBUGGING](04-TESTING-AND-DEBUGGING.md) / [05-PRACTICE](05-PRACTICE.md) / [06-SOLUTIONS-AND-REVIEW](06-SOLUTIONS-AND-REVIEW.md) / [07-TRACE-LAB](07-TRACE-LAB.md) / [VERIFICATION](VERIFICATION.md)
