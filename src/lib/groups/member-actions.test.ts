import {
  acceptGroupInvitation,
  addGroupMemberByEmail,
  createGroupInvitation,
  findAddableGroupMemberByEmail,
  getFriendlyAddMemberMessage,
  getFriendlyAddMemberRpcErrorMessage,
  getFriendlyInvitationRpcErrorMessage,
  getSupabaseErrorDetails,
} from "./member-actions";

describe("member action helpers", () => {
  it("maps member statuses to user-friendly messages", () => {
    expect(getFriendlyAddMemberMessage("not_found")).toBe("No Splitly account was found with this email.");
    expect(getFriendlyAddMemberMessage("already_member")).toBe("This person is already a member of this group.");
    expect(getFriendlyAddMemberMessage("self")).toBe("You are already a member of this group.");
    expect(getFriendlyAddMemberMessage("permission_denied")).toBe("You don't have permission to add people to this group.");
    expect(getFriendlyAddMemberMessage("found")).toBe("Something went wrong. Please try again.");
  });

  it("recognizes missing RPC/schema cache errors", () => {
    expect(getFriendlyAddMemberRpcErrorMessage({ code: "PGRST202" })).toContain("Member search is not ready");
    expect(getFriendlyInvitationRpcErrorMessage({ message: "Could not find the function in the schema cache" })).toContain("Group invitations are not ready");
  });

  it("extracts safe error details from unknown error shapes", () => {
    expect(getSupabaseErrorDetails(null)).toEqual({ message: "null" });
    expect(getSupabaseErrorDetails({ code: "PGRST202", message: "Missing function", status: 404 })).toMatchObject({
      code: "PGRST202",
      message: "Missing function",
      status: 404,
    });
  });

  it("calls the expected Supabase RPCs for group member operations", async () => {
    const single = jest.fn().mockResolvedValue({ data: { status: "found" }, error: null });
    const rpc = jest.fn(() => ({ single }));
    const supabase = { rpc };

    await findAddableGroupMemberByEmail(supabase as never, "group-1", "ada@example.com");
    await addGroupMemberByEmail(supabase as never, "group-1", "ada@example.com");
    await createGroupInvitation(supabase as never, "group-1", "new@example.com");

    expect(rpc).toHaveBeenNthCalledWith(1, "find_addable_group_member_by_email", {
      target_group_id: "group-1",
      target_email: "ada@example.com",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "add_group_member_by_email", {
      target_group_id: "group-1",
      target_email: "ada@example.com",
    });
    expect(rpc).toHaveBeenNthCalledWith(3, "create_group_invitation", {
      target_group_id: "group-1",
      target_email: "new@example.com",
    });
    expect(single).toHaveBeenCalledTimes(3);
  });

  it("normalizes accept invitation RPC result", async () => {
    const supabase = {
      rpc: jest.fn().mockResolvedValue({ data: "accepted", error: null }),
    };

    await expect(acceptGroupInvitation(supabase as never, "group-1")).resolves.toEqual({
      data: "accepted",
      error: null,
    });
    expect(supabase.rpc).toHaveBeenCalledWith("accept_group_invitation", {
      target_group_id: "group-1",
    });
  });
});
