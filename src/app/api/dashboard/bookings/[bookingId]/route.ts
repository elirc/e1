import { NextRequest } from "next/server";
import { problem, respond } from "@/lib/http";
import { getBookingDetail } from "@/lib/mock-services";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  const detail = getBookingDetail(bookingId);

  if (!detail) {
    return problem(request, 404, "Booking not found.");
  }

  return respond(request, detail);
}
