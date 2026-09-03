import type { SupabaseClient } from "@supabase/supabase-js";

export type AddMemberStatus =
  | "found"
  | "added"
  | "not_found"
  | "already_member"
  | "self"
  | "permission_denied";

export type AddMemberRpcResult = {
  status: AddMemberStatus;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
};

export type CreateGroupInvitationStatus =
  | "created"
  | "existing_user"
  | "invalid_email"
  | "permission_denied"
  | "self";

export type CreateGroupInvitationRpcResult = {
  status: CreateGroupInvitationStatus;
  email: string | null;
};

export type AcceptGroupInvitationStatus =
  | "accepted"
  | "already_member"
  | "expired"
  | "not_found"
  | "permission_denied";

export function getFriendlyAddMemberMessage(status: AddMemberStatus) {
  if (status === "not_found") return "No Splitly account was found with this email.";
  if (status === "already_member") return "This person is already a member of this group.";
  if (status === "self") return "You are already a member of this group.";
  if (status === "permission_denied") return "You don't have permission to add people to this group.";

  return "Something went wrong. Please try again.";
}

type SupabaseErrorLike = {
  code?: string;
  details?: string;
  hint?: string;
  name?: string;
  message?: string;
  serialized?: string;
  status?: number;
};

export function getSupabaseErrorDetails(error: unknown): SupabaseErrorLike {
  if (!error || typeof error !== "object") {
    return { message: String(error) };
  }

  const errorRecord = error as Record<string, unknown>;
  let serialized: string | undefined;

  try {
    serialized = JSON.stringify(error);
  } catch {
    serialized = undefined;
  }

  return {
    code: typeof errorRecord.code === "string" ? errorRecord.code : undefined,
    details: typeof errorRecord.details === "string" ? errorRecord.details : undefined,
    hint: typeof errorRecord.hint === "string" ? errorRecord.hint : undefined,
    name: error instanceof Error ? error.name : undefined,
    message: typeof errorRecord.message === "string" ? errorRecord.message : undefined,
    serialized: serialized && serialized !== "{}" ? serialized : undefined,
    status: typeof errorRecord.status === "number" ? errorRecord.status : undefined,
  };
}

export function getFriendlyAddMemberRpcErrorMessage(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const message = details.message?.toLowerCase() ?? "";

  if (
    details.code === "PGRST202"
    || message.includes("could not find the function")
    || message.includes("schema cache")
  ) {
    return "Member search is not ready yet. Apply the latest Supabase migration and try again.";
  }

  return "We couldn't search for that person. Please try again.";
}

export function getFriendlyInvitationRpcErrorMessage(error: unknown) {
  const details = getSupabaseErrorDetails(error);
  const message = details.message?.toLowerCase() ?? "";

  if (
    details.code === "PGRST202"
    || message.includes("could not find the function")
    || message.includes("schema cache")
  ) {
    return "Group invitations are not ready yet. Apply the latest Supabase migration and try again.";
  }

  return "We couldn't prepare that invitation. Please try again.";
}

export async function findAddableGroupMemberByEmail(
  supabase: SupabaseClient,
  groupId: string,
  email: string,
) {
  return supabase
    .rpc("find_addable_group_member_by_email", {
      target_group_id: groupId,
      target_email: email,
    })
    .single<AddMemberRpcResult>();
}

export async function addGroupMemberByEmail(
  supabase: SupabaseClient,
  groupId: string,
  email: string,
) {
  return supabase
    .rpc("add_group_member_by_email", {
      target_group_id: groupId,
      target_email: email,
    })
    .single<AddMemberRpcResult>();
}

export async function createGroupInvitation(
  supabase: SupabaseClient,
  groupId: string,
  email: string,
) {
  return supabase
    .rpc("create_group_invitation", {
      target_group_id: groupId,
      target_email: email,
    })
    .single<CreateGroupInvitationRpcResult>();
}

export async function acceptGroupInvitation(
  supabase: SupabaseClient,
  groupId: string,
) {
  const result = await supabase.rpc("accept_group_invitation", {
    target_group_id: groupId,
  });

  return {
    data: result.data as AcceptGroupInvitationStatus | null,
    error: result.error,
  };
}
