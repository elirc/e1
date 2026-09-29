import type { EndpointDescriptor } from "@/lib/domain";

export const authEndpoints: EndpointDescriptor[] = [
  { method: "POST", path: "/api/auth/register", summary: "Register an owner account" },
  { method: "POST", path: "/api/auth/login", summary: "Create a session" },
  { method: "POST", path: "/api/auth/logout", summary: "Invalidate the current session" },
  { method: "POST", path: "/api/auth/refresh", summary: "Rotate an access token" },
];

export const teamEndpoints: EndpointDescriptor[] = [
  { method: "POST", path: "/api/teams", summary: "Create a team workspace" },
  { method: "POST", path: "/api/teams/{teamId}/members/invite", summary: "Invite a team member" },
  { method: "PATCH", path: "/api/teams/{teamId}/members/{membershipId}/role", summary: "Update a membership role" },
  { method: "GET", path: "/api/teams/{teamId}/settings", summary: "Fetch team settings" },
  { method: "PATCH", path: "/api/teams/{teamId}/settings", summary: "Update team settings" },
];

export const eventTypeEndpoints: EndpointDescriptor[] = [
  { method: "GET", path: "/api/event-types", summary: "List event types" },
  { method: "POST", path: "/api/event-types", summary: "Create an event type" },
  { method: "GET", path: "/api/event-types/{eventTypeId}", summary: "Fetch an event type" },
  { method: "PATCH", path: "/api/event-types/{eventTypeId}", summary: "Update an event type" },
  { method: "DELETE", path: "/api/event-types/{eventTypeId}", summary: "Soft delete an event type" },
  { method: "POST", path: "/api/event-types/{eventTypeId}/publish", summary: "Publish a booking page" },
  { method: "POST", path: "/api/event-types/{eventTypeId}/unpublish", summary: "Unpublish a booking page" },
];

export const availabilityEndpoints: EndpointDescriptor[] = [
  { method: "POST", path: "/api/availability/weekly", summary: "Set weekly availability rules" },
  { method: "POST", path: "/api/availability/overrides", summary: "Create a date override" },
  { method: "GET", path: "/api/availability/window", summary: "Fetch a previewable availability window" },
];

export const bookingEndpoints: EndpointDescriptor[] = [
  { method: "GET", path: "/api/bookings/preview", summary: "Preview available slots" },
  { method: "POST", path: "/api/bookings", summary: "Create a booking" },
  { method: "POST", path: "/api/bookings/{bookingId}/confirm", summary: "Confirm a pending booking" },
  { method: "POST", path: "/api/bookings/{bookingId}/cancel", summary: "Cancel a booking" },
  { method: "POST", path: "/api/bookings/{bookingId}/reschedule", summary: "Reschedule a booking" },
  { method: "GET", path: "/api/bookings/token/{token}", summary: "Fetch a booking by guest token" },
];

export const integrationEndpoints: EndpointDescriptor[] = [
  { method: "POST", path: "/api/integrations/connect/google", summary: "Create a Google OAuth connect session" },
  { method: "POST", path: "/api/integrations/connect/m365", summary: "Create a Microsoft 365 OAuth connect session" },
  { method: "POST", path: "/api/integrations/refresh", summary: "Refresh a calendar provider token" },
  { method: "POST", path: "/api/integrations/disconnect", summary: "Disconnect a calendar integration" },
];

export const dashboardEndpoints: EndpointDescriptor[] = [
  { method: "GET", path: "/api/dashboard/upcoming", summary: "List upcoming bookings" },
  { method: "GET", path: "/api/dashboard/past", summary: "List past bookings" },
  { method: "GET", path: "/api/dashboard/bookings/{bookingId}", summary: "Fetch booking detail" },
];

export const webhookEndpoints: EndpointDescriptor[] = [
  { method: "POST", path: "/api/webhooks/calendar", summary: "Receive calendar sync callbacks" },
  { method: "POST", path: "/api/webhooks/bookings", summary: "Fan out booking webhooks" },
];

export const endpointGroups = [
  { title: "Authentication", items: authEndpoints },
  { title: "Teams", items: teamEndpoints },
  { title: "Event Types", items: eventTypeEndpoints },
  { title: "Availability", items: availabilityEndpoints },
  { title: "Bookings", items: bookingEndpoints },
  { title: "Integrations", items: integrationEndpoints },
  { title: "Dashboard", items: dashboardEndpoints },
  { title: "Webhooks", items: webhookEndpoints },
];
