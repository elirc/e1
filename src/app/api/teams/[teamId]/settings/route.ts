import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { getTeam } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  return respond(request, getTeam());
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  return respond(request, { ...getTeam(), ...body });
}
