export type Identifier = string;
export type ISODateString = string;
export type ISODateTimeString = string;

export type TeamRole = "owner" | "admin" | "member";
export type BookingStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "canceled"
  | "completed"
  | "no_show";
export type LocationType = "video" | "phone" | "in_person" | "custom";
export type TimezonePolicy = "organizer" | "invitee" | "locked";
export type AssignmentStrategy = "owner" | "round_robin";
export type CalendarProvider = "google" | "m365";
export type NotificationChannel = "email" | "sms" | "webhook";
export type NotificationStatus = "queued" | "sent" | "failed";
export type AvailabilityOverrideKind = "available" | "unavailable";
export type IntegrationStatus = "connected" | "expired" | "disconnected";

export interface Timestamps {
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  deletedAt: ISODateTimeString | null;
}

export interface User extends Timestamps {
  id: Identifier;
  email: string;
  name: string;
  username: string;
  timezone: string;
  emailVerifiedAt: ISODateTimeString | null;
  imageUrl: string | null;
}

export interface Account extends Timestamps {
  id: Identifier;
  userId: Identifier;
  provider: "credentials" | "google" | "m365";
  providerAccountId: string;
}

export interface Team extends Timestamps {
  id: Identifier;
  name: string;
  slug: string;
  ownerId: Identifier;
  brandingColor: string;
  bookingDomain: string;
  roundRobinEnabled: boolean;
}

export interface TeamMembership extends Timestamps {
  id: Identifier;
  teamId: Identifier;
  userId: Identifier;
  role: TeamRole;
}

export interface TimeRangeTemplate {
  startTime: string;
  endTime: string;
}

export interface WeeklyRule {
  dayOfWeek: number;
  ranges: TimeRangeTemplate[];
}

export interface AvailabilityTemplate extends Timestamps {
  id: Identifier;
  teamId: Identifier;
  organizerId: Identifier;
  timezone: string;
  slotIntervalMinutes: number;
  weeklyRules: WeeklyRule[];
}

export interface AvailabilityOverride extends Timestamps {
  id: Identifier;
  organizerId: Identifier;
  teamId: Identifier;
  date: ISODateString;
  kind: AvailabilityOverrideKind;
  ranges: TimeRangeTemplate[];
  reason: string;
}

export interface BlockedTimeRange extends Timestamps {
  id: Identifier;
  organizerId: Identifier;
  teamId: Identifier;
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  reason: string;
}

export interface EventType extends Timestamps {
  id: Identifier;
  teamId: Identifier;
  organizerId: Identifier;
  title: string;
  slug: string;
  profileSlug: string;
  description: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  maxParticipants: number;
  minNoticeMinutes: number;
  maxDaysInFuture: number;
  timezone: string;
  timezonePolicy: TimezonePolicy;
  locationType: LocationType;
  locationLabel: string;
  color: string;
  assignmentStrategy: AssignmentStrategy;
  cancellationPolicyHours: number;
  published: boolean;
  customThankYouMessage: string;
}

export interface BookingAttendee extends Timestamps {
  id: Identifier;
  bookingId: Identifier;
  email: string;
  name: string;
  timezone: string;
  phone: string | null;
}

export interface Booking extends Timestamps {
  id: Identifier;
  teamId: Identifier;
  eventTypeId: Identifier;
  organizerId: Identifier;
  status: BookingStatus;
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  timezone: string;
  title: string;
  locationType: LocationType;
  locationLabel: string;
  confirmationToken: string;
  cancellationReason: string | null;
  rescheduledFromBookingId: Identifier | null;
  guestCanCancel: boolean;
  guestCanReschedule: boolean;
}

export interface CalendarIntegration extends Timestamps {
  id: Identifier;
  organizerId: Identifier;
  provider: CalendarProvider;
  status: IntegrationStatus;
  email: string;
  lastSyncedAt: ISODateTimeString | null;
}

export interface NotificationRecord extends Timestamps {
  id: Identifier;
  bookingId: Identifier;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduledFor: ISODateTimeString;
  sentAt: ISODateTimeString | null;
}

export interface AuditLogEntry extends Timestamps {
  id: Identifier;
  teamId: Identifier;
  bookingId: Identifier;
  actorId: Identifier;
  action: string;
  metadata: Record<string, string>;
}

export interface PlanLimit extends Timestamps {
  id: Identifier;
  teamId: Identifier;
  plan: "starter" | "growth" | "enterprise";
  activeSeats: number;
  eventTypeLimit: number;
  smsEnabled: boolean;
}

export interface SlotPreview {
  startTime: ISODateTimeString;
  endTime: ISODateTimeString;
  timezone: string;
}

export interface PublicBookingPageModel {
  profileName: string;
  eventType: EventType;
  organizer: User;
  team: Team;
  slots: SlotPreview[];
  integrations: CalendarIntegration[];
}

export interface DashboardSnapshot {
  owner: User;
  team: Team;
  eventTypes: EventType[];
  upcomingBookings: Booking[];
  pastBookings: Booking[];
  attendeesByBookingId: Record<string, BookingAttendee[]>;
  integrations: CalendarIntegration[];
  overrides: AvailabilityOverride[];
  auditLog: AuditLogEntry[];
  planLimit: PlanLimit;
}

export interface EndpointDescriptor {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  summary: string;
}
