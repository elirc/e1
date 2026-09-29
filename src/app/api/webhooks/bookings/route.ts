import { NextRequest } from "next/server";
import { respond } from "@/lib/http";

export async function POST(request: NextRequest) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return respond(request, { received: true, kind: "booking-event", payload });
}
