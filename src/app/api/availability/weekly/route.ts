import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { setWeeklyAvailability } from "@/lib/mock-services";

export async function POST(request: NextRequest) {
  return respond(request, setWeeklyAvailability());
}
