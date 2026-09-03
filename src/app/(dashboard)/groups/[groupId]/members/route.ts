import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import {
  addGroupMemberByEmail,
  getFriendlyAddMemberMessage,
  getSupabaseErrorDetails,
} from "@/lib/groups/member-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateGroupMemberEmail } from "@/lib/validations/groups";

type AddMemberRouteContext = {
  params: Promise<{
    groupId: string;
  }>;
};

export async function POST(request: NextRequest, context: AddMemberRouteContext) {
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

  const result = await addGroupMemberByEmail(supabase, groupId, email);

  if (result.error) {
    const errorDetails = getSupabaseErrorDetails(result.error);

    console.warn("Supabase add-member insert failed", {
      ...errorDetails,
      userId: user.id,
    });

    return NextResponse.json(
      { message: "We couldn't add that person. Please try again." },
      { status: 500 },
    );
  }

  if (result.data.status !== "added" || !result.data.email) {
    return NextResponse.json(
      { message: getFriendlyAddMemberMessage(result.data.status) },
      { status: 400 },
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);

  return NextResponse.json({
    message: `${result.data.full_name?.trim() || result.data.email} was added to the group.`,
  });
}
