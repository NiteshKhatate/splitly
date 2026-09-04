import { NextResponse, type NextRequest } from "next/server";
import type { AuthError } from "@supabase/supabase-js";

import {
  createGroupInvitation,
  getFriendlyInvitationRpcErrorMessage,
  getSupabaseErrorDetails,
} from "@/lib/groups/member-actions";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateGroupMemberEmail } from "@/lib/validations/groups";

type InvitationRouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function POST(request: NextRequest, context: InvitationRouteContext) {
  const { groupId } = await context.params;
  const body = await request.json().catch(() => null) as { email?: unknown } | null;
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

  const profile = await ensureUserProfile(supabase, user);

  if (profile.error) {
    console.warn("Supabase profile setup failed before group invitation", {
      ...getSupabaseErrorDetails(profile.error),
      userId: user.id,
    });

    return NextResponse.json(
      { message: "We couldn't prepare your profile for invitations. Please try again." },
      { status: 500 },
    );
  }

  let admin;

  try {
    admin = createSupabaseAdminClient();
  } catch (error) {
    console.warn("Supabase group invitations are not configured", {
      message: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { message: "Email invitations aren't configured yet." },
      { status: 503 },
    );
  }

  const invitation = await createGroupInvitation(supabase, groupId, email);

  if (invitation.error) {
    console.warn("Supabase group invitation creation failed", {
      ...getSupabaseErrorDetails(invitation.error),
      userId: user.id,
    });

    return NextResponse.json(
      { message: getFriendlyInvitationRpcErrorMessage(invitation.error) },
      { status: 500 },
    );
  }

  if (invitation.data.status === "permission_denied") {
    return NextResponse.json(
      { message: "You don't have permission to invite people to this group." },
      { status: 403 },
    );
  }

  if (invitation.data.status === "existing_user") {
    return NextResponse.json(
      { message: "This person now has a Splitly account. Search again to add them." },
      { status: 409 },
    );
  }

  if (invitation.data.status === "self") {
    return NextResponse.json(
      { message: "You are already a member of this group." },
      { status: 400 },
    );
  }

  if (invitation.data.status !== "created" || !invitation.data.email) {
    return NextResponse.json(
      { message: "We couldn't prepare that invitation. Please try again." },
      { status: 400 },
    );
  }

  const redirectUrl = new URL(`/invite/${groupId}`, request.nextUrl.origin);
  let inviteError: AuthError | null;

  try {
    const result = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl.toString(),
      data: {
        invited_to_group: groupId,
      },
    });
    inviteError = result.error;
  } catch (error) {
    console.warn("Supabase group invitation request failed", {
      message: error instanceof Error ? error.message : String(error),
      userId: user.id,
    });

    return NextResponse.json(
      { message: "We couldn't send that invitation email. Please try again." },
      { status: 500 },
    );
  }

  if (inviteError) {
    console.warn("Supabase group invitation email failed", {
      code: inviteError.code,
      message: inviteError.message,
      status: inviteError.status,
      userId: user.id,
    });

    const isRateLimited = inviteError.status === 429
      || inviteError.code === "over_email_send_rate_limit";

    return NextResponse.json(
      {
        message: isRateLimited
          ? "Too many invitations were sent. Please wait a moment and try again."
          : "We couldn't send that invitation email. Please try again.",
      },
      { status: isRateLimited ? 429 : 500 },
    );
  }

  return NextResponse.json({
    message: `Invitation sent to ${email}.`,
  });
}
