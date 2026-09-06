import type { PrismaClient } from "@prisma/client";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import { accountUpdateSchema } from "@/lib/validations/auth";

export class AccountUpdateError extends Error {
  constructor(message: string, readonly code: "INVALID_INPUT" | "AUTH_ERROR") {
    super(message);
  }
}

type AccountDatabase = Pick<PrismaClient, "user">;
type AccountAuth = Pick<SupabaseClient, "auth">;

function friendlyAuthError(kind: "email" | "password", code?: string): string {
  if (kind === "email") {
    if (code === "email_exists" || code === "user_already_exists") return "An account already uses that email address.";
    if (code === "over_email_send_rate_limit") return "Too many confirmation emails were requested. Please wait, then try again.";
    return "We couldn't update your email address. Please try again.";
  }
  if (code === "weak_password") return "Your new password does not meet the password requirements.";
  if (code === "reauthentication_needed") return "Please sign in again before changing your password.";
  return "We couldn't update your password. Check your current password and try again.";
}

export async function updateAccount(
  database: AccountDatabase,
  supabase: AccountAuth,
  user: Pick<User, "email" | "id">,
  input: unknown,
  emailRedirectTo: string,
): Promise<{ message: string }> {
  const validation = accountUpdateSchema.safeParse(input);
  if (!validation.success) throw new AccountUpdateError("Check the account details and try again.", "INVALID_INPUT");
  const values = validation.data;

  if (values.kind === "name") {
    await database.user.update({ data: { name: values.fullName }, where: { id: user.id } });
    return { message: "Name updated." };
  }

  if (values.kind === "email") {
    if (values.email === user.email?.trim().toLowerCase()) {
      throw new AccountUpdateError("Enter a different email address.", "INVALID_INPUT");
    }
    const { error } = await supabase.auth.updateUser(
      { email: values.email },
      { emailRedirectTo },
    );
    if (error) throw new AccountUpdateError(friendlyAuthError("email", error.code), "AUTH_ERROR");
    return { message: "Check your inbox to confirm the new email address." };
  }

  const { error } = await supabase.auth.updateUser({
    current_password: values.currentPassword,
    password: values.password,
  });
  if (error) throw new AccountUpdateError(friendlyAuthError("password", error.code), "AUTH_ERROR");
  return { message: "Password updated." };
}
