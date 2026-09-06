import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ReceiptDeleteButton } from "./receipt-delete-button";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

describe("ReceiptDeleteButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("refreshes the expense after deletion", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ ok: true } as Response);
    render(<ReceiptDeleteButton attachmentId="attachment-1" expenseId="expense-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete receipt" }));
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("announces a safe error and permits retry", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ message: "That receipt could not be deleted." }), ok: false,
    } as Response);
    render(<ReceiptDeleteButton attachmentId="attachment-1" expenseId="expense-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Delete receipt" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That receipt could not be deleted.");
    expect(screen.getByRole("button", { name: "Delete receipt" })).toBeEnabled();
  });
});
