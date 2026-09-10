import { act, fireEvent, render, screen } from "@testing-library/react";

import { showToast, ToastViewport } from "./toast";

describe("ToastViewport", () => {
  it("shows confirmed mutation feedback and allows dismissal", () => {
    render(<ToastViewport />);

    fireEvent(
      window,
      new CustomEvent("splitly:toast", {
        detail: { message: "Expense added.", tone: "success" },
      }),
    );

    expect(screen.getByRole("status")).toHaveTextContent("Expense added.");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("replaces an existing notice without rendering duplicate toasts", () => {
    render(<ToastViewport />);

    act(() => {
      showToast({ message: "Group updated.", tone: "success" });
      showToast({ message: "Expense updated.", tone: "success" });
    });

    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Expense updated.");
  });
});
