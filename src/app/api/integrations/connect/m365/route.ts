import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { connectIntegration } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  return respond(request, connectIntegration("m365"));
}
