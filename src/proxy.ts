import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requestGuardFailure } from "@/lib/security/request-guards";
import { updateSession } from "@/lib/supabase/middleware";

export function proxy(request: NextRequest) {
  const failure = requestGuardFailure({
    contentLength: request.headers.get("content-length"),
    method: request.method,
    origin: request.headers.get("origin"),
    pathname: request.nextUrl.pathname,
    requestOrigin: request.nextUrl.origin,
  });
  if (failure) return NextResponse.json({ message: failure.message }, { status: failure.status });
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
