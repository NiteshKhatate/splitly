import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { captureServerError } from "@/lib/monitoring/server-monitor";
import { readJsonBody, RequestBodyError } from "@/lib/security/request-body";
import { reminderPreferencesSchema } from "@/lib/validations/reminders";
import { getDb } from "@/server/db";

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to update your preferences." }, { status: 401 });

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof RequestBodyError ? error.message : "Request body is invalid." },
      { status: error instanceof RequestBodyError && error.code === "TOO_LARGE" ? 413 : 400 },
    );
  }

  const validation = reminderPreferencesSchema.safeParse(body);
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
    await captureServerError("reminder_preference_update_failed", { userId: user.id });
    return NextResponse.json({ message: "We couldn't save your reminder preference." }, { status: 500 });
  }
}
