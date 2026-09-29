import type {
  AvailabilityOverride,
  EventType,
  TeamRole,
} from "@/lib/domain";
import { createBookingService } from "@/lib/booking-service";
import {
  bookingRepository,
  getAccounts,
  getAvailabilityOverrides,
  getAvailabilityTemplates,
  getBlockedTimes,
  getBookingAttendees,
  getBookingById,
  getBookingByToken,
  getCalendarIntegrations,
  getDashboardSnapshot,
  getEventTypes,
  getMemberships,
  getPublicBookingPage,
  getTeam,
  getUsers,
} from "@/lib/demo-data";

export function registerOwner(input: { email?: string; name?: string }) {
  return {
    id: `usr_${crypto.randomUUID()}`,
    email: input.email ?? "new-owner@example.com",
    name: input.name ?? "New Owner",
    workspaceSlug: "new-workspace",
    verified: false,
  };
}

export function loginOwner(input: { email?: string }) {
  const account = getAccounts().find(
    (candidate) => candidate.providerAccountId === input.email,
  );

  return {
    token: crypto.randomUUID(),
    refreshToken: crypto.randomUUID(),
    provider: account?.provider ?? "credentials",
    ownerId: account?.userId ?? getUsers()[0].id,
  };
}

export function createTeam(input: { name?: string }) {
  return {
    ...getTeam(),
    id: `team_${crypto.randomUUID()}`,
    name: input.name ?? "New Team",
  };
}

export function inviteMember(input: { email?: string }) {
  return {
    inviteId: crypto.randomUUID(),
    email: input.email ?? "teammate@example.com",
    role: "member" as TeamRole,
    expiresInHours: 48,
  };
}

export function assignMembershipRole(role: TeamRole) {
  return {
    membership: getMemberships()[2],
    assignedRole: role,
  };
}

export function listEventTypes() {
  return getEventTypes();
}

export function getEventType(eventTypeId: string) {
  return getEventTypes().find((eventType) => eventType.id === eventTypeId) ?? null;
}

export function createEventType(input: Partial<EventType>) {
  return {
    ...getEventTypes()[0],
    id: `evt_${crypto.randomUUID()}`,
    title: input.title ?? "New Event Type",
    slug: input.slug ?? "new-event-type",
    published: false,
  };
}

export function updateEventType(eventTypeId: string, input: Partial<EventType>) {
  const current = getEventType(eventTypeId) ?? getEventTypes()[0];
  return {
    ...current,
    ...input,
    id: current.id,
  };
}

export function setWeeklyAvailability() {
  return getAvailabilityTemplates()[0];
}

export function createAvailabilityOverride(input: Partial<AvailabilityOverride>) {
  return {
    ...getAvailabilityOverrides()[0],
    id: `override_${crypto.randomUUID()}`,
    ...input,
  };
}

export function getAvailabilityWindow(input: {
  profileSlug?: string;
  eventSlug?: string;
}) {
  return getPublicBookingPage(
    input.profileSlug ?? "jordan-lee",
    input.eventSlug ?? "strategy-sync",
  );
}

export function previewSlots(input: { profileSlug?: string; eventSlug?: string }) {
  return (
    getPublicBookingPage(
      input.profileSlug ?? "jordan-lee",
      input.eventSlug ?? "strategy-sync",
    )?.slots ?? []
  );
}

const bookingService = createBookingService({ repository: bookingRepository, events: getEventTypes(),
  templates: getAvailabilityTemplates(), overrides: getAvailabilityOverrides(), blockedTimes: getBlockedTimes() });
export const createBooking = bookingService.create;
export const confirmBooking = bookingService.confirm;
export const cancelBooking = bookingService.cancel;
export const rescheduleBooking = bookingService.reschedule;

export function listUpcomingBookings() {
  return getDashboardSnapshot().upcomingBookings;
}

export function listPastBookings() {
  return getDashboardSnapshot().pastBookings;
}

export function getBookingDetail(bookingId: string) {
  const booking = getBookingById(bookingId);
  const attendeeList = getBookingAttendees().filter(
    (attendee) => attendee.bookingId === bookingId,
  );

  if (!booking) {
    return null;
  }

  return {
    booking,
    attendees: attendeeList,
    eventType: getEventType(booking.eventTypeId),
  };
}

export function getBookingDetailByToken(token: string) {
  const booking = getBookingByToken(token);

  if (!booking) {
    return null;
  }

  return {
    booking,
    attendees: getBookingAttendees().filter(
      (attendee) => attendee.bookingId === booking.id,
    ),
  };
}

export function connectIntegration(provider: "google" | "m365") {
  return {
    provider,
    status: "connected",
    authorizationUrl: `https://example.com/oauth/${provider}`,
  };
}

export function refreshIntegration() {
  return {
    refreshed: true,
    integrations: getCalendarIntegrations(),
  };
}

export function disconnectIntegration() {
  return {
    disconnected: true,
  };
}

export function getHealthSnapshot() {
  return {
    team: getTeam(),
    owner: getUsers()[0],
    metrics: {
      bookingsPerDay: 42,
      conversionRate: 0.68,
      conflictsPrevented: 7,
      failedNotifications: 1,
    },
    schedules: getAvailabilityTemplates(),
    overrides: getAvailabilityOverrides(),
    blockedTimes: getBlockedTimes(),
  };
}
