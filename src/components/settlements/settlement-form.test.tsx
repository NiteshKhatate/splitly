import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { SettlementForm } from "./settlement-form";

const replace = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh, replace }) }));

const members = [
  { id: "00000000-0000-4000-8000-000000000001", name: "Alex" },
  { id: "00000000-0000-4000-8000-000000000002", name: "Sam" },
];

describe("SettlementForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders settle-up defaults", () => {
    render(<SettlementForm currencies={["INR"]} defaults={{
      amount: "8.00", currency: "INR", payeeId: members[0].id, payerId: members[1].id,
    }} groupId="group-1" members={members} />);
    expect(screen.getByLabelText("Payer")).toHaveValue(members[1].id);
    expect(screen.getByLabelText("Recipient")).toHaveValue(members[0].id);
    expect(screen.getByLabelText("Amount")).toHaveValue("8.00");
  });

  it("blocks invalid same-person settlements in the client", async () => {
    render(<SettlementForm currencies={["INR"]} groupId="group-1" members={members} />);
    fireEvent.change(screen.getByLabelText("Payer"), { target: { value: members[0].id } });
    fireEvent.change(screen.getByLabelText("Recipient"), { target: { value: members[0].id } });
    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "Record settlement" }));
    expect(await screen.findByText("Payer and recipient must be different people.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits once and refreshes balances after success", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ json: async () => ({ settlementId: "settlement-1" }), ok: true } as Response);
    render(<SettlementForm currencies={["INR"]} defaults={{
      amount: "8", payeeId: members[0].id, payerId: members[1].id,
    }} groupId="group-1" members={members} />);

    fireEvent.click(screen.getByRole("button", { name: "Record settlement" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/groups/group-1/balances");
    expect(refresh).toHaveBeenCalled();
  });

  it("preserves the form and shows a server error", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ json: async () => ({ message: "Currency is not available." }), ok: false } as Response);
    render(<SettlementForm currencies={["INR"]} defaults={{
      amount: "8", payeeId: members[0].id, payerId: members[1].id,
    }} groupId="group-1" members={members} />);
    fireEvent.click(screen.getByRole("button", { name: "Record settlement" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Currency is not available.");
    expect(screen.getByLabelText("Amount")).toHaveValue("8");
  });
});
