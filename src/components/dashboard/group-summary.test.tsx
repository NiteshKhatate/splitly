import { render, screen } from "@testing-library/react";

import { GroupSummary } from "./group-summary";
import type { Group } from "./types";

const groups: Group[] = [
  {
    id: "group-1",
    name: "Goa trip",
    members: 3,
    balance: {
      amountInMinorUnits: 12500,
      label: "You are owed ₹125",
      tone: "success",
    },
    href: "/groups/group-1",
  },
  {
    id: "group-2",
    name: "Flatmates",
    members: 1,
    balance: {
      amountInMinorUnits: 0,
      label: "Settled up",
      tone: "neutral",
    },
    href: "/groups/group-2",
  },
];

describe("GroupSummary", () => {
  it("renders groups with member counts and balance state", () => {
    render(<GroupSummary groups={groups} />);

    expect(screen.getByRole("link", { name: /goa trip/i })).toHaveAttribute("href", "/groups/group-1");
    expect(screen.getByText(/3 members.*you are owed ₹125/i)).toBeInTheDocument();
    expect(screen.getByText("You are owed ₹125")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /flatmates/i })).toHaveAttribute("href", "/groups/group-2");
    expect(screen.getByText(/1 member/i)).toBeInTheDocument();
  });

  it("renders an empty state with a create group action", () => {
    render(<GroupSummary groups={[]} />);

    expect(screen.getByText("You don't have any groups yet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /\+ create a group/i })).toHaveAttribute("href", "/groups/new");
  });

  it("renders loading and error states", () => {
    const { rerender } = render(<GroupSummary groups={[]} state="loading" />);

    expect(screen.getByRole("status", { name: /loading section/i })).toBeInTheDocument();

    rerender(<GroupSummary groups={[]} state="error" />);

    expect(screen.getByRole("alert")).toHaveTextContent("Your groups couldn't be loaded.");
  });
});
