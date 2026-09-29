import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { createAvailabilityOverride } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return respond(
    request,
    createAvailabilityOverride(body),
    { status: 201 },
    { created: true },
  );
}
