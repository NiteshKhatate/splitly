import { fireEvent, render, screen } from "@testing-library/react";

import { ExpenseLedger } from "./expense-ledger";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

describe("ExpenseLedger", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("renders the important expense fields", () => {
    render(<ExpenseLedger groupId="group-1" expenses={[{
      amount: "₹1,250.5",
      canManage: true,
      category: "Groceries",
      currency: "INR",
      date: "4 Sept 2026",
      description: "Weekly groceries",
      id: "expense-1",
      participants: ["Alex", "Sam"],
      payers: ["Alex"],
    }]} />);

    expect(screen.getByRole("heading", { name: "Weekly groceries" })).toBeInTheDocument();
    expect(screen.getByText("₹1,250.5")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    expect(screen.getByText("Alex, Sam")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Actions for Weekly groceries" }));
    expect(screen.getByRole("menuitem", { name: "Edit expense" })).toHaveAttribute("href", "/expenses/expense-1/edit");
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete expense" }));
    expect(screen.getByRole("dialog", { name: "Delete expense?" })).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not show edit or delete actions to a non-creator", () => {
    render(<ExpenseLedger groupId="group-1" expenses={[{
      amount: "₹500",
      canManage: false,
      category: "Dining",
      currency: "INR",
      date: "5 Sept 2026",
      description: "Lunch",
      id: "expense-2",
      participants: ["Alex", "Sam"],
      payers: ["Sam"],
    }]} />);

    expect(screen.queryByRole("button", { name: "Actions for Lunch" })).not.toBeInTheDocument();
  });

  it("renders an actionable empty state", () => {
    render(<ExpenseLedger groupId="group-1" expenses={[]} />);

    expect(screen.getByText("No expenses found.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add expense" })).toHaveAttribute(
      "href",
      "/groups/group-1/expenses/new",
    );
  });
});
