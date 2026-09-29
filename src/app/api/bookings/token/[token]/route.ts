import { NextRequest } from "next/server";
import { problem, respond } from "@/lib/http";
import { getBookingDetailByToken } from "@/lib/mock-services";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const detail = getBookingDetailByToken(token);

  if (!detail) {
    return problem(request, 404, "Booking token not found.");
  }

  return respond(request, detail);
}
