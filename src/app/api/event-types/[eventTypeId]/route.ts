import { NextRequest } from "next/server";
import { problem, respond } from "@/lib/http";
import { getEventType, updateEventType } from "@/lib/mock-services";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventTypeId: string }> },
) {
  const { eventTypeId } = await context.params;
  const eventType = getEventType(eventTypeId);
  if (!eventType) {
    return problem(request, 404, "Event type not found.");
  }

  return respond(request, eventType);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventTypeId: string }> },
) {
  const { eventTypeId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return respond(request, updateEventType(eventTypeId, body));
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ eventTypeId: string }> },
) {
  const { eventTypeId } = await context.params;
  return respond(request, { id: eventTypeId, deletedAt: new Date().toISOString() });
}
