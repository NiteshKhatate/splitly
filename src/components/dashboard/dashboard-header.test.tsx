import { render, screen, within } from "@testing-library/react";

import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader", () => {
  it("uses the planned five-destination mobile navigation", () => {
    render(<DashboardHeader activePath="/activity" userName="Maya" />);

    const navigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(navigation).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/dashboard");
    expect(within(navigation).getByRole("link", { name: "Activity" })).toHaveAttribute("href", "/activity");
    expect(within(navigation).getByRole("link", { name: "Add expense" })).toHaveAttribute("href", "/expenses/new");
    expect(within(navigation).getByRole("link", { name: "Groups" })).toHaveAttribute("href", "/groups");
    expect(within(navigation).getByRole("link", { name: "Account" })).toHaveAttribute("href", "/settings");
    expect(within(navigation).getByRole("link", { name: "Activity" })).toHaveAttribute("aria-current", "page");
  });

  it("provides persistent desktop navigation and the primary expense action", () => {
    render(<DashboardHeader activePath="/groups" userName="Maya" />);

    const navigation = screen.getByRole("navigation", { name: "Desktop navigation" });
    expect(within(navigation).getByRole("link", { name: "Groups" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("link", { name: "Add expense" })[0]).toHaveAttribute("href", "/expenses/new");
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument();
  });
});
