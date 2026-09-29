import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { loginOwner } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { email?: string };
  return respond(request, loginOwner(body));
}
