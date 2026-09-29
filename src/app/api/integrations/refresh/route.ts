import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { refreshIntegration } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  return respond(request, refreshIntegration());
}
