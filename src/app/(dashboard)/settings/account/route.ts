import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { AccountUpdateError, updateAccount } from "@/lib/settings/update-account";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to update your account." }, { status: 401 });

  try {
    const result = await updateAccount(
      getDb(),
      supabase,
      user,
      await request.json().catch(() => null),
      `${new URL(request.url).origin}/auth/callback?next=/settings`,
    );
    revalidatePath("/settings");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AccountUpdateError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "We couldn't update your account. Please try again." }, { status: 500 });
  }
}
