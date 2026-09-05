import { render, screen } from "@testing-library/react";

import { ExpenseLedger } from "./expense-ledger";

describe("ExpenseLedger", () => {
  it("renders the important expense fields", () => {
    render(<ExpenseLedger groupId="group-1" expenses={[{
      amount: "₹1,250.5",
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
