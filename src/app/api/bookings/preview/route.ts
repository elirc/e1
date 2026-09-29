import { NextRequest } from "next/server";
import { problem, respond } from "@/lib/http";
import { previewSlots } from "@/lib/mock-services";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  const limit = rateLimit(`preview:${ip}`, 40, 60_000);

  if (!limit.allowed) {
    return problem(request, 429, "Rate limit exceeded for slot previews.");
  }

  const profileSlug = request.nextUrl.searchParams.get("profileSlug") ?? undefined;
  const eventSlug = request.nextUrl.searchParams.get("eventSlug") ?? undefined;

  return respond(request, previewSlots({ profileSlug, eventSlug }), undefined, {
    remaining: limit.remaining,
  });
}
