"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreateGroupFormState } from "@/lib/groups/create-group-form-state";
import {
  type CreateGroupFormFields,
  validateCreateGroupForm,
} from "@/lib/validations/groups";

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
  const errors = validateCreateGroupForm(fields);

  if (Object.keys(errors).length > 0) {
    return {
      fields,
      errors,
      message: "Please fix the highlighted fields.",
    };
  }

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
  const createdGroup = await supabase
    .from("groups")
    .insert({
      id: groupId,
      name: fields.name.trim(),
      description: fields.description.trim() || null,
      created_by: user.id,
      currency: "INR",
    });

  if (createdGroup.error) {
    console.warn("Supabase group creation failed", {
      code: createdGroup.error.code,
      details: createdGroup.error.details,
      hint: createdGroup.error.hint,
      message: createdGroup.error.message,
      userId: user.id,
    });

    return {
      fields,
      errors: {},
      message: "We couldn't create that group. Please try again.",
    };
  }

  const membership = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: "admin",
    });

  if (membership.error) {
    console.warn("Supabase group admin membership creation failed", {
      code: membership.error.code,
      details: membership.error.details,
      hint: membership.error.hint,
      message: membership.error.message,
      userId: user.id,
    });

    return {
      fields,
      errors: {},
      message: "The group was created, but your membership couldn't be saved. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/groups");
  redirect(`/groups/${groupId}`);
}
