import type { AvailabilityOverride, AvailabilityTemplate, BlockedTimeRange, Booking, EventType } from "@/lib/domain";
import type { BookingRepository } from "@/lib/booking-repository";
import { generateSlots } from "@/lib/availability";
import { canTransitionBooking, transitionBooking } from "@/lib/booking-state";

export class BookingError extends Error {
  status: 400 | 403 | 404 | 409;
  constructor(status: 400 | 403 | 404 | 409, message: string) { super(message); this.status = status; }
}
export function bookingFailure(error: unknown) {
  return error instanceof BookingError ? { status: error.status, message: error.message } :
    { status: 500, message: "Unable to complete booking request." };
}
function required(value: unknown, field: string, max = 256): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new BookingError(400, `${field} is required and must be valid.`);
  return value.trim();
}
export function createBookingService(options: {
  repository: BookingRepository; events: EventType[]; templates: AvailabilityTemplate[];
  overrides: AvailabilityOverride[]; blockedTimes: BlockedTimeRange[]; clock?: () => Date;
}) {
  const { repository } = options;
  const clock = options.clock ?? (() => new Date());
  const eventFor = (id: unknown) => {
    const eventId = required(id, "eventTypeId");
    const event = options.events.find(item => item.id === eventId && item.published && !item.deletedAt);
    if (!event) throw new BookingError(404, "Published event not found.");
    return event;
  };
  function offered(event: EventType, value: unknown, bookings: Booking[], now: Date) {
    const start = required(value, "startTime");
    // Require an explicit offset; never interpret a caller's local wall time as server time.
    if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(start) || !Number.isFinite(Date.parse(start)))
      throw new BookingError(400, "startTime must be an ISO timestamp with an offset.");
    const instant = new Date(start);
    const template = options.templates.find(item => item.organizerId === event.organizerId && !item.deletedAt);
    if (!template) throw new BookingError(409, "No availability configured.");
    const slots = generateSlots({ eventType: event, template, overrides: options.overrides,
      blockedTimes: options.blockedTimes, bookings, eventTypes: options.events,
      rangeStart: instant, rangeEnd: new Date(instant.getTime() + event.durationMinutes * 60_000), now, limit: 1 });
    const slot = slots.find(item => item.startTime === instant.toISOString());
    if (!slot) throw new BookingError(409, "Requested time is unavailable.");
    return slot;
  }
  function authorize(bookings: Booking[], id: string, token: unknown, action?: "cancel" | "reschedule") {
    const booking = bookings.find(item => item.id === id && !item.deletedAt);
    if (!booking) throw new BookingError(404, "Booking not found.");
    if (typeof token !== "string" || !token || booking.confirmationToken !== token)
      throw new BookingError(403, "A valid guest confirmation token is required.");
    if ((action === "cancel" && !booking.guestCanCancel) || (action === "reschedule" && !booking.guestCanReschedule))
      throw new BookingError(403, "Guest action is disabled.");
    return booking;
  }
  function transition(booking: Booking, status: "confirmed" | "canceled", now: Date, reason?: string) {
    if (!canTransitionBooking(booking.status, status)) throw new BookingError(409, "Booking is in a terminal or incompatible state.");
    return transitionBooking(booking, status, reason, now);
  }
  return {
    create(input: unknown) {
      if (!input || typeof input !== "object" || Array.isArray(input)) throw new BookingError(400, "Booking fields are required.");
      const fields = input as Record<string, unknown>;
      const event = eventFor(fields.eventTypeId);
      const email = required(fields.attendeeEmail, "attendeeEmail");
      const name = required(fields.attendeeName, "attendeeName", 120);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BookingError(400, "A valid attendee email is required.");
      const now = clock();
      return repository.transaction(state => {
        const slot = offered(event, fields.startTime, state.bookings, now);
        const timestamps = { createdAt: now.toISOString(), updatedAt: now.toISOString(), deletedAt: null };
        const booking: Booking = { ...timestamps, id: `book_${crypto.randomUUID()}`, teamId: event.teamId,
          eventTypeId: event.id, organizerId: event.organizerId, status: "confirmed", ...slot,
          title: `${event.title} with ${name}`, locationType: event.locationType, locationLabel: event.locationLabel,
          confirmationToken: crypto.randomUUID(), cancellationReason: null, rescheduledFromBookingId: null,
          guestCanCancel: true, guestCanReschedule: true };
        const attendee = { ...timestamps, id: `att_${crypto.randomUUID()}`, bookingId: booking.id,
          email, name, timezone: event.timezone, phone: null };
        state.bookings.push(booking); state.attendees.push(attendee);
        return { booking, attendee };
      });
    },
    confirm(id: string, token: unknown) {
      return repository.transaction(state => {
        const booking = authorize(state.bookings, id, token);
        if (booking.status === "confirmed") return booking;
        const next = transition(booking, "confirmed", clock());
        const event = eventFor(booking.eventTypeId);
        offered(event, booking.startTime, state.bookings.filter(item => item.id !== id), clock());
        state.bookings[state.bookings.findIndex(item => item.id === id)] = next;
        return next;
      });
    },
    cancel(id: string, reason: unknown, token: unknown) {
      return repository.transaction(state => {
        const booking = authorize(state.bookings, id, token, "cancel");
        const next = transition(booking, "canceled", clock(), required(reason, "reason", 1000));
        state.bookings[state.bookings.findIndex(item => item.id === id)] = next;
        return next;
      });
    },
    reschedule(id: string, startTime: unknown, token: unknown) {
      return repository.transaction(state => {
        const booking = authorize(state.bookings, id, token, "reschedule");
        if (booking.status !== "pending" && booking.status !== "confirmed") throw new BookingError(409, "Only active bookings can be rescheduled.");
        const now = clock();
        const slot = offered(eventFor(booking.eventTypeId), startTime, state.bookings.filter(item => item.id !== id), now);
        const previous = transition(booking, "canceled", now, "Rescheduled by guest");
        const replacement: Booking = { ...booking, ...slot, id: `book_${crypto.randomUUID()}`, status: "confirmed",
          confirmationToken: crypto.randomUUID(), cancellationReason: null, rescheduledFromBookingId: id,
          createdAt: now.toISOString(), updatedAt: now.toISOString() };
        const attendees = state.attendees.filter(item => item.bookingId === id).map(item => ({ ...item,
          id: `att_${crypto.randomUUID()}`, bookingId: replacement.id, createdAt: now.toISOString(), updatedAt: now.toISOString() }));
        state.bookings[state.bookings.findIndex(item => item.id === id)] = previous;
        state.bookings.push(replacement); state.attendees.push(...attendees);
        return { previous, replacement };
      });
    },
  };
}
