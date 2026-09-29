import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { createEventType, listEventTypes } from "@/lib/mock-services";

export async function GET(request: NextRequest) {
  return respond(request, listEventTypes());
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return respond(
    request,
    createEventType(body),
    { status: 201 },
    { created: true },
  );
}
