import { render, screen } from "@testing-library/react";

import { ActivityFeed } from "./activity-feed";

describe("ActivityFeed", () => {
  it("shows structured activity with its group, time, and destination", () => {
    render(<ActivityFeed items={[{
      createdAt: "2026-09-05T10:30:00.000Z",
      description: "Alex added ₹2,400 groceries",
      groupId: "group-1",
      groupName: "Flatmates",
      href: "/expenses/expense-1",
      id: "event-1",
      label: "Expense added",
      type: "EXPENSE_CREATED",
    }]} />);

    expect(screen.getByText("Alex added ₹2,400 groceries")).toBeInTheDocument();
    expect(screen.getByText(/Flatmates/)).toBeInTheDocument();
    expect(screen.getByText("Expense added")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/expenses/expense-1");
    expect(screen.getByText(/5 Sept 2026/)).toHaveAttribute("datetime", "2026-09-05T10:30:00.000Z");
  });

  it("shows an empty state when there are no events", () => {
    render(<ActivityFeed items={[]} />);

    expect(screen.getByText("No activity yet.")).toBeInTheDocument();
    expect(screen.getByText("New expenses and settlements will appear here.")).toBeInTheDocument();
  });
});
