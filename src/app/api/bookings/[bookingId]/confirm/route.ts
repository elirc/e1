import { bookingFailure } from "@/lib/booking-service";
import { NextRequest } from "next/server";
import { problem, respond } from "@/lib/http";
import { confirmBooking } from "@/lib/mock-services";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return problem(request, 400, "A JSON object is required.");
  try {
    return respond(request, confirmBooking(bookingId, body.confirmationToken));
  } catch (error) {
    const failure = bookingFailure(error);
    return problem(request, failure.status, failure.message);
  }
}
