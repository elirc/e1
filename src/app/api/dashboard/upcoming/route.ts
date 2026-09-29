import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { listUpcomingBookings } from "@/lib/mock-services";

export async function GET(request: NextRequest) {
  return respond(request, listUpcomingBookings());
}
