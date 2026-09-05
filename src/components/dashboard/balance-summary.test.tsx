import { render, screen } from "@testing-library/react";

import { BalanceSummary } from "./balance-summary";

describe("BalanceSummary", () => {
  it("renders the supplied ledger totals instead of sample values", () => {
    render(<BalanceSummary summaries={[{
      currency: "INR",
      net: { amount: "+₹500", description: "Overall, you're owed money", tone: "success" },
      youAreOwed: { amount: "₹800", tone: "success" },
      youOwe: { amount: "₹300", tone: "danger" },
    }]} />);

    expect(screen.getByText("₹300")).toBeInTheDocument();
    expect(screen.getByText("₹800")).toBeInTheDocument();
    expect(screen.getByText("+₹500")).toBeInTheDocument();
    expect(screen.queryByText("₹1,250")).not.toBeInTheDocument();
  });

  it("shows an explicit error state", () => {
    render(<BalanceSummary summaries={[]} state="error" />);
    expect(screen.getByText("Your balance summary couldn't be loaded. Please try again later.")).toBeInTheDocument();
  });
});
