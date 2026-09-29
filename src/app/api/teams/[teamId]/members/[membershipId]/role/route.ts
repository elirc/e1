import { NextRequest } from "next/server";
import { respond } from "@/lib/http";
import { assignMembershipRole } from "@/lib/mock-services";

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: "owner" | "admin" | "member";
  };

  return respond(request, assignMembershipRole(body.role ?? "member"));
}
