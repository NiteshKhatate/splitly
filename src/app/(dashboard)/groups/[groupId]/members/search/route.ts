import { NextResponse, type NextRequest } from "next/server";

import {
  findAddableGroupMemberByEmail,
  getFriendlyAddMemberMessage,
  getFriendlyAddMemberRpcErrorMessage,
  getSupabaseErrorDetails,
} from "@/lib/groups/member-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { captureServerError } from "@/lib/monitoring/server-monitor";
import { readJsonBody, RequestBodyError } from "@/lib/security/request-body";
import { validateGroupMemberEmail } from "@/lib/validations/groups";
import { getDb } from "@/server/db";

type SearchRouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function POST(request: NextRequest, context: SearchRouteContext) {
  const { groupId } = await context.params;
  let body: { email?: unknown } | null;
  try {
    body = await readJsonBody(request) as { email?: unknown } | null;
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof RequestBodyError ? error.message : "Request body is invalid." },
      { status: error instanceof RequestBodyError && error.code === "TOO_LARGE" ? 413 : 400 },
    );
  }
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const fieldError = validateGroupMemberEmail(email);

  if (fieldError) {
    return NextResponse.json({ fieldError }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Please log in to continue." }, { status: 401 });
  }

  const rateLimit = await consumeRateLimit(getDb(), `member-search:${groupId}`, user.id, 20, 600);
  if (!rateLimit.allowed) return NextResponse.json(
    { message: "Too many searches. Please try again shortly." },
    { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
  );

  const result = await findAddableGroupMemberByEmail(supabase, groupId, email);

  if (result.error) {
    const errorDetails = getSupabaseErrorDetails(result.error);

    console.warn("Supabase add-member lookup failed", {
      ...errorDetails,
      userId: user.id,
    });
    await captureServerError("group_member_search_failed", { groupId, userId: user.id });

    return NextResponse.json(
      { message: getFriendlyAddMemberRpcErrorMessage(result.error) },
      { status: 500 },
    );
  }

  if (result.data.status === "not_found") {
    return NextResponse.json({ invitableEmail: email });
  }

  if (result.data.status !== "found" || !result.data.user_id || !result.data.email) {
    return NextResponse.json(
      { message: getFriendlyAddMemberMessage(result.data.status) },
      { status: 400 },
    );
  }

  return NextResponse.json({
    candidate: {
      userId: result.data.user_id,
      name: result.data.full_name?.trim() || result.data.email.split("@")[0],
      email: result.data.email,
    },
  });
}
