import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reminderPreferencesSchema } from "@/lib/validations/reminders";
import { getDb } from "@/server/db";

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to update your preferences." }, { status: 401 });

  const validation = reminderPreferencesSchema.safeParse(await request.json().catch(() => null));
  if (!validation.success) {
    return NextResponse.json({ message: "Choose a valid reminder preference." }, { status: 400 });
  }

  try {
    await getDb().user.update({
      data: { remindersEnabled: validation.data.remindersEnabled },
      where: { id: user.id },
    });
    revalidatePath("/settings");
    return NextResponse.json({ remindersEnabled: validation.data.remindersEnabled });
  } catch {
    return NextResponse.json({ message: "We couldn't save your reminder preference." }, { status: 500 });
  }
}
