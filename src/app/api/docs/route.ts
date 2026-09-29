import { NextRequest } from "next/server";
import { endpointGroups } from "@/lib/api-manifest";
import { respond } from "@/lib/http";

export async function GET(request: NextRequest) {
  return respond(request, endpointGroups, undefined, { documented: true });
}
