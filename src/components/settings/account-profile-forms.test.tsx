import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AccountProfileForms } from "./account-profile-forms";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("AccountProfileForms", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders current account details and blocks invalid name submission", async () => {
    render(<AccountProfileForms currentEmail="ada@example.com" currentName="Ada Lovelace" />);
    expect(screen.getByLabelText("Full name")).toHaveValue("Ada Lovelace");
    expect(screen.getByLabelText("Email address")).toHaveValue("ada@example.com");

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Update name" }));
    expect(await screen.findByText("Enter your full name.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("updates the name and refreshes server-rendered profile data", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ json: async () => ({ message: "Name updated." }), ok: true } as Response);
    render(<AccountProfileForms currentEmail="ada@example.com" currentName="Ada Lovelace" />);
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Ada Byron" } });
    fireEvent.click(screen.getByRole("button", { name: "Update name" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith("/settings/account", expect.objectContaining({
      body: JSON.stringify({ kind: "name", fullName: "Ada Byron" }), method: "PATCH",
    })));
    expect(await screen.findByRole("status")).toHaveTextContent("Name updated.");
    expect(refresh).toHaveBeenCalled();
  });

  it("requests an email change and preserves input on a server error", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ message: "An account already uses that email address." }), ok: false,
    } as Response);
    render(<AccountProfileForms currentEmail="ada@example.com" currentName="Ada" />);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "taken@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Update email" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("An account already uses that email address.");
    expect(screen.getByLabelText("Email address")).toHaveValue("taken@example.com");
  });

  it("validates matching passwords and clears them after success", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ json: async () => ({ message: "Password updated." }), ok: true } as Response);
    render(<AccountProfileForms currentEmail="ada@example.com" currentName="Ada" />);
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "old-password" } });
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "different" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Password updated.");
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
  });
});
