import { fireEvent, render, screen } from "@testing-library/react";

import { ReceiptUploadForm } from "./receipt-upload-form";

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: jest.fn() }) }));

describe("ReceiptUploadForm accessibility", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("associates file guidance with the input", () => {
    render(<ReceiptUploadForm expenseId="expense-1" />);
    expect(screen.getByLabelText("Receipt file")).toHaveAccessibleDescription("JPEG, PNG, or PDF. Maximum 5 MB.");
  });

  it("announces and associates a missing-file error", async () => {
    render(<ReceiptUploadForm expenseId="expense-1" />);
    fireEvent.click(screen.getByRole("button", { name: "Upload receipt" }));

    const input = screen.getByLabelText("Receipt file");
    expect(await screen.findByRole("alert")).toHaveTextContent("Choose a receipt file.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/Choose a receipt file/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
