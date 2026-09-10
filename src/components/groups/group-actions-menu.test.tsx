import { fireEvent, render, screen } from "@testing-library/react";

import { GroupActionsMenu } from "./group-actions-menu";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

describe("GroupActionsMenu", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("groups the available group actions into one menu", () => {
    render(<GroupActionsMenu canAddMembers canManage groupId="group-1" />);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Group actions" }));

    expect(screen.getByRole("menu", { name: "Group actions" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Balances" })).toHaveAttribute("href", "/groups/group-1/balances");
    expect(screen.getByRole("menuitem", { name: "View expenses" })).toHaveAttribute("href", "/groups/group-1/expenses");
    expect(screen.getByRole("menuitem", { name: "Add expense" })).toHaveAttribute("href", "/groups/group-1/expenses/new");
    expect(screen.getByRole("menuitem", { name: "Edit group" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Add people" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete group" })).toBeInTheDocument();
  });

  it("omits admin actions for ordinary members", () => {
    render(<GroupActionsMenu canAddMembers={false} canManage={false} groupId="group-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Group actions" }));

    expect(screen.queryByRole("menuitem", { name: "Edit group" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Add people" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Delete group" })).not.toBeInTheDocument();
  });

  it("opens the add-people dialog and closes both layers with Escape", () => {
    render(<GroupActionsMenu canAddMembers canManage groupId="group-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Group actions" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Add people" }));
    expect(screen.getByRole("dialog", { name: "Add people" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
