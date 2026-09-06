import { AccountUpdateError, updateAccount } from "./update-account";

const user = { email: "ada@example.com", id: "00000000-0000-4000-8000-000000000001" };

function createBoundaries() {
  return {
    database: { user: { update: jest.fn().mockResolvedValue({}) } },
    supabase: { auth: { updateUser: jest.fn().mockResolvedValue({ data: { user }, error: null }) } },
  };
}

describe("updateAccount", () => {
  it("updates only the authenticated profile row for a name change", async () => {
    const { database, supabase } = createBoundaries();
    await expect(updateAccount(database as never, supabase as never, user, {
      kind: "name", fullName: " Ada Byron ",
    }, "https://splitly.test/auth/callback?next=/settings")).resolves.toEqual({ message: "Name updated." });
    expect(database.user.update).toHaveBeenCalledWith({ data: { name: "Ada Byron" }, where: { id: user.id } });
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("requests a confirmed normalized email change", async () => {
    const { database, supabase } = createBoundaries();
    await expect(updateAccount(database as never, supabase as never, user, {
      kind: "email", email: " NEW@Example.COM ",
    }, "https://splitly.test/auth/callback?next=/settings")).resolves.toEqual({
      message: "Check your inbox to confirm the new email address.",
    });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith(
      { email: "new@example.com" },
      { emailRedirectTo: "https://splitly.test/auth/callback?next=/settings" },
    );
  });

  it("rejects the current email without calling Supabase", async () => {
    const { database, supabase } = createBoundaries();
    await expect(updateAccount(database as never, supabase as never, user, {
      kind: "email", email: "ADA@example.com",
    }, "https://splitly.test/callback")).rejects.toEqual(
      new AccountUpdateError("Enter a different email address.", "INVALID_INPUT"),
    );
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it("submits the current and new password to the authenticated boundary", async () => {
    const { database, supabase } = createBoundaries();
    await expect(updateAccount(database as never, supabase as never, user, {
      kind: "password", currentPassword: "old-password", password: "new-password", confirmPassword: "new-password",
    }, "https://splitly.test/callback")).resolves.toEqual({ message: "Password updated." });
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({ current_password: "old-password", password: "new-password" });
  });

  it("validates before writes and converts authentication failures to safe errors", async () => {
    const invalid = createBoundaries();
    await expect(updateAccount(invalid.database as never, invalid.supabase as never, user, {
      kind: "name", fullName: "",
    }, "https://splitly.test/callback")).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(invalid.database.user.update).not.toHaveBeenCalled();

    const failed = createBoundaries();
    failed.supabase.auth.updateUser.mockResolvedValue({ data: { user: null }, error: { code: "email_exists" } });
    await expect(updateAccount(failed.database as never, failed.supabase as never, user, {
      kind: "email", email: "taken@example.com",
    }, "https://splitly.test/callback")).rejects.toEqual(
      new AccountUpdateError("An account already uses that email address.", "AUTH_ERROR"),
    );
  });
});
