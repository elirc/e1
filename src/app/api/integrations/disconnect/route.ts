import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { disconnectIntegration } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  return respond(request, disconnectIntegration());
}
