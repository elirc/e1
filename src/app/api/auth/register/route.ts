import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { registerOwner } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
  };

  return respond(request, registerOwner(body), { status: 201 }, { created: true });
}
