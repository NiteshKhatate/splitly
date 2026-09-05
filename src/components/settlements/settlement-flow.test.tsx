import { fireEvent, render, screen } from "@testing-library/react";

import { SettlementFlow, SettleUpButton } from "./settlement-flow";

jest.mock("./settlement-form", () => ({
  SettlementForm: ({
    defaults,
    payee,
  }: {
    defaults: { amount: string; currency: string };
    payee: { name: string };
  }) => (
    <div>
      Settlement form for {payee.name}: {defaults.amount} {defaults.currency}
    </div>
  ),
}));

const payer = { id: "00000000-0000-4000-8000-000000000001", name: "Alex" };
const payee = { id: "00000000-0000-4000-8000-000000000002", name: "Sam" };

describe("SettlementFlow", () => {
  it("mounts the form only after a settle-up button is clicked", () => {
    render(
      <SettlementFlow currencies={["INR"]} groupId="group-1" payer={payer}>
        <SettleUpButton amount="8.00" currency="INR" payee={payee} />
      </SettlementFlow>,
    );

    const settleUpButton = screen.getByRole("button", { name: "Settle up" });
    expect(screen.queryByRole("heading", { name: "Record settlement" })).not.toBeInTheDocument();
    expect(settleUpButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(settleUpButton);

    expect(screen.getByRole("heading", { name: "Record settlement" })).toBeInTheDocument();
    expect(screen.getByText("Settlement form for Sam: 8.00 INR")).toBeInTheDocument();
    expect(settleUpButton).toHaveAttribute("aria-expanded", "true");
  });
});
