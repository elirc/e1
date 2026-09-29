import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { createTeam } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { name?: string };
  return respond(request, createTeam(body), { status: 201 }, { created: true });
}
