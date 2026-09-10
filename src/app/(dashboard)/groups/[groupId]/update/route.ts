import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { GroupMutationError, updateGroup } from "@/lib/groups/manage-group";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in to update this group." }, { status: 401 });
  }

  try {
    const result = await updateGroup(
      getDb(),
      groupId,
      user.id,
      await request.json().catch(() => null),
    );
    revalidatePath("/dashboard");
    revalidatePath("/groups");
    revalidatePath(`/groups/${groupId}`);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof GroupMutationError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ message: error.message }, { status });
    }

    return NextResponse.json({ message: "We couldn't update that group." }, { status: 500 });
  }
}
