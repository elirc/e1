import { NextRequest } from "next/server";
import { respond } from "@/lib/http";

export async function POST(request: NextRequest) {
  return respond(request, {
    accessToken: crypto.randomUUID(),
    refreshToken: crypto.randomUUID(),
  });
}
