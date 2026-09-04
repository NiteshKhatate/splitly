import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import {
  acceptGroupInvitation,
  getSupabaseErrorDetails,
} from "@/lib/groups/member-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AcceptInvitationRouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function POST(_request: NextRequest, context: AcceptInvitationRouteContext) {
  const { groupId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Please sign in to accept this invitation." }, { status: 401 });
  }

  const result = await acceptGroupInvitation(supabase, groupId);

  if (result.error) {
    console.warn("Supabase group invitation acceptance failed", {
      ...getSupabaseErrorDetails(result.error),
      userId: user.id,
    });

    return NextResponse.json(
      { message: "We couldn't accept this invitation. Please try again." },
      { status: 500 },
    );
  }

  if (result.data === "expired") {
    return NextResponse.json(
      { message: "This invitation has expired. Ask a group admin to send a new one." },
      { status: 410 },
    );
  }

  if (result.data === "not_found" || result.data === "permission_denied") {
    return NextResponse.json(
      { message: "This invitation doesn't match the account you're signed in with." },
      { status: 403 },
    );
  }

  if (result.data !== "accepted" && result.data !== "already_member") {
    return NextResponse.json(
      { message: "We couldn't accept this invitation. Please try again." },
      { status: 400 },
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);

  return NextResponse.json({ redirectTo: `/groups/${groupId}` });
}
