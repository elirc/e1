import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { updateEventType } from "@/lib/mock-services";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventTypeId: string }> },
) {
  const { eventTypeId } = await context.params;
  return respond(request, updateEventType(eventTypeId, { published: true }));
}
