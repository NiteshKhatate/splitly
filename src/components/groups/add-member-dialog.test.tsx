import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddMemberDialog } from "./add-member-dialog";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh,
  }),
}));

describe("AddMemberDialog", () => {
  beforeEach(() => {
    refresh.mockClear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens the dialog and shows validation errors for invalid email", async () => {
    render(<AddMemberDialog groupId="group-1" />);

    fireEvent.click(screen.getByRole("button", { name: /\+ add people/i }));
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByRole("button", { name: /find person/i }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("searches for a valid email and shows a matching user", async () => {
    jest.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidate: {
          id: "user-2",
          name: "Ada Lovelace",
          email: "ada@example.com",
        },
      }),
    } as Response);

    render(<AddMemberDialog groupId="group-1" />);

    fireEvent.click(screen.getByRole("button", { name: /\+ add people/i }));
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: " Ada@Example.COM " },
    });
    fireEvent.click(screen.getByRole("button", { name: /find person/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/groups/group-1/members/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "ada@example.com" }),
      });
    });
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("adds a found user and refreshes the route", async () => {
    jest.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidate: {
            id: "user-2",
            name: "Ada Lovelace",
            email: "ada@example.com",
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          message: "Ada Lovelace was added to the group.",
        }),
      } as Response);

    render(<AddMemberDialog groupId="group-1" />);

    fireEvent.click(screen.getByRole("button", { name: /\+ add people/i }));
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /find person/i }));
    fireEvent.click(await screen.findByRole("button", { name: /add person/i }));

    expect(await screen.findByText("Ada Lovelace was added to the group.")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
