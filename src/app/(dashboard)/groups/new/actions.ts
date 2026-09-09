"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ensureUserProfile } from "@/lib/auth/profiles";
import { createGroup } from "@/lib/groups/create-group";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateGroupFormState } from "@/lib/groups/create-group-form-state";
import {
  type CreateGroupFormFields,
  validateCreateGroupForm,
} from "@/lib/validations/groups";
import { getDb } from "@/server/db";

function getStringField(formData: FormData, field: keyof CreateGroupFormFields) {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function createGroupAction(
  _previousState: CreateGroupFormState,
  formData: FormData,
): Promise<CreateGroupFormState> {
  const fields = {
    name: getStringField(formData, "name"),
    description: getStringField(formData, "description"),
  };
  const validation = validateCreateGroupForm(fields);

  if (!validation.data) {
    return {
      fields,
      errors: validation.errors,
      message: "Please fix the highlighted fields.",
    };
  }

  const data = validation.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/groups/new");
  }

  const profile = await ensureUserProfile(supabase, user);

  if (profile.error) {
    console.warn("Supabase profile setup failed before group creation", {
      code: profile.error.code,
      details: profile.error.details,
      hint: profile.error.hint,
      message: profile.error.message,
      userId: user.id,
    });

    return {
      fields,
      errors: {},
      message: "We couldn't prepare your profile for group creation. Please try again.",
    };
  }

  const groupId = crypto.randomUUID();
  try {
    await createGroup(getDb(), {
      createdBy: user.id,
      defaultCurrency: "INR",
      description: data.description || null,
      id: groupId,
      name: data.name,
    });
  } catch {
    console.warn("Atomic group creation failed", {
      groupId,
      userId: user.id,
    });

    return {
      fields,
      errors: {},
      message: "We couldn't create that group. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");
  redirect(`/groups/${groupId}`);
}
