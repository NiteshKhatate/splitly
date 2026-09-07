import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { SignupForm } from "./signup-form";

const push = jest.fn();
const refresh = jest.fn();
const signUp = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
jest.mock("@/lib/supabase/client", () => ({ createSupabaseBrowserClient: jest.fn() }));
jest.mock("@/lib/auth/profiles", () => ({ ensureUserProfile: jest.fn() }));

describe("SignupForm email links", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signUp.mockResolvedValue({ data: { session: null, user: null }, error: null });
    jest.mocked(createSupabaseBrowserClient).mockReturnValue({ auth: { signUp } } as never);
  });

  it("uses the server-provided production origin for confirmation emails", async () => {
    render(<SignupForm applicationOrigin="https://splitly.example" />);
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
      options: expect.objectContaining({
        emailRedirectTo: "https://splitly.example/auth/callback?next=/dashboard",
      }),
    })));
  });
});
