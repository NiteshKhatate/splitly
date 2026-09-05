import { render, screen } from "@testing-library/react";

import { SettlementPanel } from "./settlement-panel";

jest.mock("./settlement-form", () => ({
  SettlementForm: ({ payee }: { payee: { name: string } }) => (
    <div>Settlement form for {payee.name}</div>
  ),
}));

const payer = { id: "00000000-0000-4000-8000-000000000001", name: "Alex" };
const payee = { id: "00000000-0000-4000-8000-000000000002", name: "Sam" };

describe("SettlementPanel", () => {
  it("does not render until a suggested repayment is selected", () => {
    const { container } = render(
      <SettlementPanel currencies={["INR"]} groupId="group-1" payer={payer} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("heading", { name: "Record settlement" })).not.toBeInTheDocument();
  });

  it("renders the form for the selected recipient", () => {
    render(
      <SettlementPanel
        currencies={["INR"]}
        groupId="group-1"
        payee={payee}
        payer={payer}
      />,
    );

    expect(screen.getByRole("heading", { name: "Record settlement" })).toBeInTheDocument();
    expect(screen.getByText("Settlement form for Sam")).toBeInTheDocument();
  });
});
