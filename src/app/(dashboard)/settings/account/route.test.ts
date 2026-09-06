import { revalidatePath } from "next/cache";

import { AccountUpdateError, updateAccount } from "@/lib/settings/update-account";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

import { PATCH } from "./route";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      json: async () => body,
      status: init?.status ?? 200,
    }),
  },
}));
jest.mock("@/lib/settings/update-account", () => ({
  AccountUpdateError: class AccountUpdateError extends Error {
    constructor(message: string, readonly code: string) { super(message); }
  },
  updateAccount: jest.fn(),
}));
jest.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: jest.fn() }));
jest.mock("@/server/db", () => ({ getDb: jest.fn(() => ({ user: {} })) }));

function request(body: unknown) {
  return {
    json: async () => body,
    url: "https://splitly.test/settings/account",
  } as Request;
}

describe("settings account route", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires an authenticated user", async () => {
    jest.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);
    const response = await PATCH(request({ kind: "name", fullName: "Ada" }));
    expect(response.status).toBe(401);
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("passes only the authenticated identity to the account service", async () => {
    const user = { email: "ada@example.com", id: "user-1" };
    const supabase = { auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) } };
    jest.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    jest.mocked(updateAccount).mockResolvedValue({ message: "Name updated." });
    const response = await PATCH(request({ kind: "name", fullName: "Ada" }));

    expect(response.status).toBe(200);
    expect(updateAccount).toHaveBeenCalledWith(
      getDb(), supabase, user, { kind: "name", fullName: "Ada" },
      "https://splitly.test/auth/callback?next=/settings",
    );
    expect(revalidatePath).toHaveBeenCalledWith("/settings");
  });

  it("returns safe validation and unexpected errors", async () => {
    jest.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { email: "ada@example.com", id: "user-1" } } }) },
    } as never);
    jest.mocked(updateAccount).mockRejectedValueOnce(new AccountUpdateError("Check the account details and try again.", "INVALID_INPUT"));
    expect((await PATCH(request(null))).status).toBe(400);

    jest.mocked(updateAccount).mockRejectedValueOnce(new Error("database internals"));
    const response = await PATCH(request({ kind: "name", fullName: "Ada" }));
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: "We couldn't update your account. Please try again." });
  });
});
