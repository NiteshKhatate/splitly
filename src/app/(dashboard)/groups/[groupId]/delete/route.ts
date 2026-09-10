import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { deleteGroup, GroupMutationError } from "@/lib/groups/manage-group";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in to delete this group." }, { status: 401 });
  }

  try {
    const result = await deleteGroup(getDb(), groupId, user.id);
    revalidatePath("/dashboard");
    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GroupMutationError) {
      const status = error.code === "FORBIDDEN" ? 403 : 404;
      return NextResponse.json({ message: error.message }, { status });
    }

    return NextResponse.json({ message: "We couldn't delete that group." }, { status: 500 });
  }
}
