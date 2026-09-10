import { fireEvent, render, screen } from "@testing-library/react";

import { ConfirmationDialog } from "./confirmation-dialog";

const defaultProps = {
  confirmLabel: "Delete item",
  description: "This action cannot be undone.",
  errorMessage: undefined,
  isPending: false,
  onCancel: jest.fn(),
  onConfirm: jest.fn(),
  open: true,
  pendingLabel: "Deleting...",
  title: "Delete item?",
};

describe("ConfirmationDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("describes the destructive action and waits for explicit confirmation", () => {
    render(<ConfirmationDialog {...defaultProps} />);

    const dialog = screen.getByRole("dialog", { name: "Delete item?" });
    expect(dialog).toHaveAccessibleDescription("This action cannot be undone.");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete item" }));
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("can be dismissed with Escape when no request is pending", () => {
    render(<ConfirmationDialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("cannot be dismissed while confirmation is pending", () => {
    render(<ConfirmationDialog {...defaultProps} isPending />);
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close confirmation dialog" }));

    expect(defaultProps.onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Deleting..." })).toBeDisabled();
  });
});
