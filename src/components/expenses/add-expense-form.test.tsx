import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { AddExpenseForm } from "./add-expense-form";

const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const members = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Alex" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Sam" },
];

describe("AddExpenseForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("shows a live equal-split preview in minor-unit-safe amounts", async () => {
    render(<AddExpenseForm currency="INR" groupId="group-1" members={members} />);

    fireEvent.change(screen.getByLabelText("Total amount"), { target: { value: "10.01" } });

    expect(await screen.findByText("₹5.01")).toBeInTheDocument();
    expect(screen.getByText("₹5.00")).toBeInTheDocument();
  });

  it("blocks an invalid submission in the client", async () => {
    render(<AddExpenseForm currency="INR" groupId="group-1" members={members} />);

    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    expect(await screen.findByText("Enter a description.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits validated values once and returns to the group", async () => {
    jest.mocked(global.fetch).mockResolvedValue({
      json: async () => ({ expenseId: "expense-1" }),
      ok: true,
    } as Response);
    render(<AddExpenseForm currency="INR" groupId="group-1" members={members} />);

    fireEvent.change(screen.getByLabelText("Description"), { target: { value: "Dinner" } });
    fireEvent.change(screen.getByLabelText("Total amount"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Alex", { selector: "input[inputmode='decimal']" }), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Save expense" }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(push).toHaveBeenCalledWith("/groups/group-1");
    expect(refresh).toHaveBeenCalled();
  });
});
