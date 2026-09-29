import { NextRequest, NextResponse } from "next/server";

export function respond<T>(
  request: NextRequest,
  data: T,
  init?: ResponseInit,
  meta?: Record<string, string | number | boolean | null>,
) {
  const correlationId =
    request.headers.get("x-correlation-id") ?? crypto.randomUUID();

  return NextResponse.json(
    {
      data,
      meta: {
        correlationId,
        ...meta,
      },
    },
    {
      ...init,
      headers: {
        "x-correlation-id": correlationId,
        ...(init?.headers ?? {}),
      },
    },
  );
}

export function problem(
  request: NextRequest,
  status: number,
  message: string,
  meta?: Record<string, string | number | boolean | null>,
) {
  return respond(
    request,
    { error: message },
    { status },
    { ok: false, ...meta },
  );
}
