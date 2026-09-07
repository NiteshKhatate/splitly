import { render, screen } from "@testing-library/react";

import { RecentActivity } from "./recent-activity";

const item = {
  createdAt: "2026-09-05T10:30:00.000Z",
  description: "Alex added ₹2,400 groceries",
  groupId: "group-1",
  groupName: "Flatmates",
  href: "/expenses/expense-1",
  id: "event-1",
  label: "Expense added",
  type: "EXPENSE_CREATED" as const,
};

describe("RecentActivity", () => {
  it("uses the structured activity feed and links to the full history", () => {
    render(<RecentActivity items={[item]} />);

    expect(screen.getByText(item.description)).toBeInTheDocument();
    expect(screen.getByText(item.label)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute("href", "/activity");
    expect(screen.getByRole("link", { name: new RegExp(item.description) })).toHaveAttribute("href", item.href);
  });

  it("shows a dashboard-specific error state", () => {
    render(<RecentActivity items={[]} state="error" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Your recent activity couldn't be loaded.");
  });
});
