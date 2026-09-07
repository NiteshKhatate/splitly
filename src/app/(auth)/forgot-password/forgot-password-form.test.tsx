import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { ForgotPasswordForm } from "./forgot-password-form";

const resetPasswordForEmail = jest.fn();

jest.mock("@/lib/supabase/client", () => ({ createSupabaseBrowserClient: jest.fn() }));

describe("ForgotPasswordForm email links", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPasswordForEmail.mockResolvedValue({ error: null });
    jest.mocked(createSupabaseBrowserClient).mockReturnValue({ auth: { resetPasswordForEmail } } as never);
  });

  it("uses the server-provided production origin for reset emails", async () => {
    render(<ForgotPasswordForm applicationOrigin="https://splitly.example" />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ada@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    await waitFor(() => expect(resetPasswordForEmail).toHaveBeenCalledWith(
      "ada@example.com",
      { redirectTo: "https://splitly.example/reset-password" },
    ));
  });
});
