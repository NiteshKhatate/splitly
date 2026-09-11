import { render, screen, within } from "@testing-library/react";

import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader", () => {
  it("keeps every primary destination available in the mobile navigation", () => {
    render(<DashboardHeader activePath="/activity" userName="Maya" />);

    const navigation = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(within(navigation).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/dashboard");
    expect(within(navigation).getByRole("link", { name: "Groups" })).toHaveAttribute("href", "/groups");
    expect(within(navigation).getByRole("link", { name: "Activity" })).toHaveAttribute("href", "/activity");
    expect(within(navigation).getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/settings");
    expect(within(navigation).getByRole("link", { name: "Activity" })).toHaveAttribute("aria-current", "page");
  });
});
