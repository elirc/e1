import { NextRequest } from "next/server";
import { problem, respond } from "@/lib/http";
import { getAvailabilityWindow } from "@/lib/mock-services";

export async function GET(request: NextRequest) {
  const profileSlug = request.nextUrl.searchParams.get("profileSlug") ?? undefined;
  const eventSlug = request.nextUrl.searchParams.get("eventSlug") ?? undefined;
  const page = getAvailabilityWindow({ profileSlug, eventSlug });

  if (!page) {
    return problem(request, 404, "Availability window not found.");
  }

  return respond(request, page);
}
