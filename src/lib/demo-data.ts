import { createBookingRepository, type BookingRepository } from "@/lib/booking-repository";
import type {
  Account,
  AuditLogEntry,
  AvailabilityOverride,
  AvailabilityTemplate,
  BlockedTimeRange,
  Booking,
  BookingAttendee,
  CalendarIntegration,
  DashboardSnapshot,
  EventType,
  PlanLimit,
  PublicBookingPageModel,
  Team,
  TeamMembership,
  User,
} from "@/lib/domain";
import { generateSlots } from "@/lib/availability";
import { addMinutes } from "@/lib/time";

const now = new Date();
const isoNow = now.toISOString();

function isoFromNow(minutes: number) {
  return addMinutes(now, minutes).toISOString();
}

const users: User[] = [
  {
    id: "usr_owner_jordan",
    email: "jordan@pulseboard.io",
    name: "Jordan Lee",
    username: "jordan-lee",
    timezone: "America/Los_Angeles",
    emailVerifiedAt: isoNow,
    imageUrl: null,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "usr_admin_mina",
    email: "mina@pulseboard.io",
    name: "Mina Torres",
    username: "mina-torres",
    timezone: "America/New_York",
    emailVerifiedAt: isoNow,
    imageUrl: null,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "usr_member_sam",
    email: "sam@pulseboard.io",
    name: "Sam Patel",
    username: "sam-patel",
    timezone: "Europe/London",
    emailVerifiedAt: isoNow,
    imageUrl: null,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const accounts: Account[] = [
  {
    id: "acc_credentials_jordan",
    userId: "usr_owner_jordan",
    provider: "credentials",
    providerAccountId: "jordan@pulseboard.io",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "acc_google_jordan",
    userId: "usr_owner_jordan",
    provider: "google",
    providerAccountId: "google-1029",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const team: Team = {
  id: "team_pulseboard",
  name: "Pulseboard",
  slug: "pulseboard",
  ownerId: "usr_owner_jordan",
  brandingColor: "#165d4f",
  bookingDomain: "book.pulseboard.local",
  roundRobinEnabled: true,
  createdAt: isoNow,
  updatedAt: isoNow,
  deletedAt: null,
};

const memberships: TeamMembership[] = [
  {
    id: "tm_owner",
    teamId: team.id,
    userId: "usr_owner_jordan",
    role: "owner",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "tm_admin",
    teamId: team.id,
    userId: "usr_admin_mina",
    role: "admin",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "tm_member",
    teamId: team.id,
    userId: "usr_member_sam",
    role: "member",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const eventTypes: EventType[] = [
  {
    id: "evt_strategy_sync",
    teamId: team.id,
    organizerId: "usr_owner_jordan",
    title: "Strategy Sync",
    slug: "strategy-sync",
    profileSlug: "jordan-lee",
    description:
      "A focused 30-minute planning call with lightweight prep, automated reminders, and cancellation controls.",
    durationMinutes: 30,
    slotIntervalMinutes: 30,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
    maxParticipants: 1,
    minNoticeMinutes: 120,
    maxDaysInFuture: 30,
    timezone: "America/Los_Angeles",
    timezonePolicy: "invitee",
    locationType: "video",
    locationLabel: "Pulseboard Meet",
    color: "#165d4f",
    assignmentStrategy: "owner",
    cancellationPolicyHours: 12,
    published: true,
    customThankYouMessage:
      "You are booked. We will send reminders and a one-click reschedule link.",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "evt_team_handoff",
    teamId: team.id,
    organizerId: "usr_admin_mina",
    title: "Team Handoff Review",
    slug: "team-handoff-review",
    profileSlug: "pulseboard-team",
    description:
      "Round-robin team review for implementation handoffs, onboarding, and weekly planning requests.",
    durationMinutes: 45,
    slotIntervalMinutes: 15,
    bufferBeforeMinutes: 15,
    bufferAfterMinutes: 15,
    maxParticipants: 4,
    minNoticeMinutes: 240,
    maxDaysInFuture: 45,
    timezone: "America/New_York",
    timezonePolicy: "organizer",
    locationType: "custom",
    locationLabel: "Shared team room",
    color: "#3657b0",
    assignmentStrategy: "round_robin",
    cancellationPolicyHours: 24,
    published: true,
    customThankYouMessage:
      "Your team review is in the queue. Routing will assign the least-loaded host.",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const availabilityTemplates: AvailabilityTemplate[] = [
  {
    id: "avail_jordan_default",
    teamId: team.id,
    organizerId: "usr_owner_jordan",
    timezone: "America/Los_Angeles",
    slotIntervalMinutes: 30,
    weeklyRules: [
      { dayOfWeek: 1, ranges: [{ startTime: "09:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }] },
      { dayOfWeek: 2, ranges: [{ startTime: "09:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }] },
      { dayOfWeek: 3, ranges: [{ startTime: "09:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }] },
      { dayOfWeek: 4, ranges: [{ startTime: "09:00", endTime: "12:00" }, { startTime: "13:00", endTime: "17:00" }] },
      { dayOfWeek: 5, ranges: [{ startTime: "09:00", endTime: "12:00" }, { startTime: "13:00", endTime: "16:00" }] },
    ],
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "avail_team_default",
    teamId: team.id,
    organizerId: "usr_admin_mina",
    timezone: "America/New_York",
    slotIntervalMinutes: 15,
    weeklyRules: [
      { dayOfWeek: 1, ranges: [{ startTime: "10:00", endTime: "16:00" }] },
      { dayOfWeek: 2, ranges: [{ startTime: "10:00", endTime: "16:00" }] },
      { dayOfWeek: 3, ranges: [{ startTime: "10:00", endTime: "16:00" }] },
      { dayOfWeek: 4, ranges: [{ startTime: "10:00", endTime: "16:00" }] },
    ],
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const tomorrowDate = new Date(now.getTime() + 86_400_000).toISOString().slice(0, 10);
const nextWeekDate = new Date(now.getTime() + 6 * 86_400_000)
  .toISOString()
  .slice(0, 10);

const availabilityOverrides: AvailabilityOverride[] = [
  {
    id: "override_jordan_focus",
    organizerId: "usr_owner_jordan",
    teamId: team.id,
    date: tomorrowDate,
    kind: "unavailable",
    ranges: [{ startTime: "12:00", endTime: "14:00" }],
    reason: "Focus block for roadmap prep",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "override_jordan_bonus",
    organizerId: "usr_owner_jordan",
    teamId: team.id,
    date: nextWeekDate,
    kind: "available",
    ranges: [{ startTime: "18:00", endTime: "20:00" }],
    reason: "Overflow evening office hours",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const blockedTimes: BlockedTimeRange[] = [
  {
    id: "blocked_sync",
    organizerId: "usr_owner_jordan",
    teamId: team.id,
    startTime: isoFromNow(26 * 60),
    endTime: isoFromNow(27 * 60),
    reason: "Executive sync imported from Google Calendar",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const bookings: Booking[] = [
  {
    id: "book_upcoming_1",
    teamId: team.id,
    eventTypeId: "evt_strategy_sync",
    organizerId: "usr_owner_jordan",
    status: "confirmed",
    startTime: isoFromNow(29 * 60),
    endTime: isoFromNow(29 * 60 + 30),
    timezone: "America/Los_Angeles",
    title: "Strategy Sync with Northstar Labs",
    locationType: "video",
    locationLabel: "Pulseboard Meet",
    confirmationToken: "tok_upcoming_1",
    cancellationReason: null,
    rescheduledFromBookingId: null,
    guestCanCancel: true,
    guestCanReschedule: true,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "book_upcoming_2",
    teamId: team.id,
    eventTypeId: "evt_team_handoff",
    organizerId: "usr_admin_mina",
    status: "pending",
    startTime: isoFromNow(55 * 60),
    endTime: isoFromNow(55 * 60 + 45),
    timezone: "America/New_York",
    title: "Team Handoff Review for Atlas",
    locationType: "custom",
    locationLabel: "Shared team room",
    confirmationToken: "tok_upcoming_2",
    cancellationReason: null,
    rescheduledFromBookingId: null,
    guestCanCancel: true,
    guestCanReschedule: false,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "book_past_1",
    teamId: team.id,
    eventTypeId: "evt_strategy_sync",
    organizerId: "usr_owner_jordan",
    status: "completed",
    startTime: isoFromNow(-26 * 60),
    endTime: isoFromNow(-25 * 60 - 30),
    timezone: "America/Los_Angeles",
    title: "Completed Strategy Sync",
    locationType: "video",
    locationLabel: "Pulseboard Meet",
    confirmationToken: "tok_past_1",
    cancellationReason: null,
    rescheduledFromBookingId: null,
    guestCanCancel: false,
    guestCanReschedule: false,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const attendees: BookingAttendee[] = [
  {
    id: "attendee_1",
    bookingId: "book_upcoming_1",
    email: "ana@northstarlabs.com",
    name: "Ana Bryant",
    timezone: "America/Denver",
    phone: null,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "attendee_2",
    bookingId: "book_upcoming_2",
    email: "jules@atlas.com",
    name: "Jules King",
    timezone: "Europe/Paris",
    phone: "+33 6 40 55 18 92",
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "attendee_3",
    bookingId: "book_past_1",
    email: "lena@solstice.com",
    name: "Lena Chen",
    timezone: "America/Chicago",
    phone: null,
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const integrations: CalendarIntegration[] = [
  {
    id: "integration_google",
    organizerId: "usr_owner_jordan",
    provider: "google",
    status: "connected",
    email: "jordan@pulseboard.io",
    lastSyncedAt: isoFromNow(-17),
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
  {
    id: "integration_m365",
    organizerId: "usr_admin_mina",
    provider: "m365",
    status: "expired",
    email: "mina@pulseboard.io",
    lastSyncedAt: isoFromNow(-320),
    createdAt: isoNow,
    updatedAt: isoNow,
    deletedAt: null,
  },
];

const auditLog: AuditLogEntry[] = [
  {
    id: "audit_1",
    teamId: team.id,
    bookingId: "book_upcoming_1",
    actorId: "usr_owner_jordan",
    action: "booking.confirmed",
    metadata: { source: "owner-dashboard", correlationId: "demo-confirm-1" },
    createdAt: isoFromNow(-45),
    updatedAt: isoFromNow(-45),
    deletedAt: null,
  },
  {
    id: "audit_2",
    teamId: team.id,
    bookingId: "book_upcoming_2",
    actorId: "usr_admin_mina",
    action: "booking.pending",
    metadata: { source: "team-routing", correlationId: "demo-pending-1" },
    createdAt: isoFromNow(-25),
    updatedAt: isoFromNow(-25),
    deletedAt: null,
  },
];

const planLimit: PlanLimit = {
  id: "plan_pulseboard",
  teamId: team.id,
  plan: "growth",
  activeSeats: 3,
  eventTypeLimit: 20,
  smsEnabled: false,
  createdAt: isoNow,
  updatedAt: isoNow,
  deletedAt: null,
};

export function getUsers() {
  return users;
}

export function getAccounts() {
  return accounts;
}

export function getMemberships() {
  return memberships;
}

export function getTeam() {
  return team;
}

export function getEventTypes() {
  return eventTypes;
}

export function getAvailabilityTemplates() {
  return availabilityTemplates;
}

export function getAvailabilityOverrides() {
  return availabilityOverrides;
}

export function getBlockedTimes() {
  return blockedTimes;
}

// Shared only within this Node process; restart restores the seed.
const demoGlobal = globalThis as typeof globalThis & { e1BookingRepository?: BookingRepository };
export const bookingRepository = demoGlobal.e1BookingRepository ??= createBookingRepository({ bookings, attendees });

export function getBookings() {
  return bookingRepository.read().bookings;
}

export function getBookingAttendees() {
  return bookingRepository.read().attendees;
}

export function getCalendarIntegrations() {
  return integrations;
}

export function getAuditLog() {
  return auditLog;
}

export function getPlanLimit() {
  return planLimit;
}

export function getDashboardSnapshot(): DashboardSnapshot {
  const now = new Date();
  const upcomingBookings = getBookings()
    .filter((booking) => new Date(booking.startTime) >= now)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));

  const pastBookings = getBookings()
    .filter((booking) => new Date(booking.startTime) < now)
    .sort((left, right) => right.startTime.localeCompare(left.startTime));

  const attendeesByBookingId = getBookingAttendees().reduce<Record<string, BookingAttendee[]>>(
    (accumulator, attendee) => {
      accumulator[attendee.bookingId] = [
        ...(accumulator[attendee.bookingId] ?? []),
        attendee,
      ];
      return accumulator;
    },
    {},
  );

  return {
    owner: users[0],
    team,
    eventTypes,
    upcomingBookings,
    pastBookings,
    attendeesByBookingId,
    integrations,
    overrides: availabilityOverrides,
    auditLog,
    planLimit,
  };
}

export function getPublicBookingPage(
  profileSlug: string,
  eventSlug: string,
): PublicBookingPageModel | null {
  const eventType =
    eventTypes.find(
      (candidate) =>
        candidate.profileSlug === profileSlug && candidate.slug === eventSlug && candidate.published && !candidate.deletedAt,
    ) ?? null;

  if (!eventType) {
    return null;
  }

  const organizer = users.find((user) => user.id === eventType.organizerId);
  const template = availabilityTemplates.find(
    (candidate) => candidate.organizerId === eventType.organizerId,
  );

  if (!organizer || !template) {
    return null;
  }

  const now = new Date();
  const slots = generateSlots({
    now,
    eventTypes,
    eventType,
    template,
    overrides: availabilityOverrides.filter(
      (override) => override.organizerId === eventType.organizerId,
    ),
    blockedTimes: blockedTimes.filter(
      (blocked) => blocked.organizerId === eventType.organizerId,
    ),
    bookings: getBookings().filter(
      (booking) => booking.organizerId === eventType.organizerId,
    ),
    rangeStart: now,
    rangeEnd: addMinutes(now, eventType.maxDaysInFuture * 24 * 60),
  });

  return {
    profileName: organizer.name,
    organizer,
    team,
    eventType,
    slots,
    integrations: integrations.filter(
      (integration) => integration.organizerId === organizer.id,
    ),
  };
}

export function getBookingById(bookingId: string) {
  return getBookings().find((booking) => booking.id === bookingId) ?? null;
}

export function getBookingByToken(token: string) {
  return getBookings().find((booking) => booking.confirmationToken === token) ?? null;
}
