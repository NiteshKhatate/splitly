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
      amount: "8.00", currency: "INR",
    }} groupId="group-1" payee={members[1]} payer={members[0]} />);
    expect(screen.queryByLabelText("Payer")).not.toBeInTheDocument();
    expect(screen.getByText("Alex (you)")).toBeInTheDocument();
    expect(screen.getByText("Sam")).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "Recipient" })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Amount")).toHaveValue("8.00");
  });

  it("keeps the selected recipient in a hidden form value", () => {
    const { container } = render(<SettlementForm currencies={["INR"]} groupId="group-1" payee={members[1]} payer={members[0]} />);
    expect(container.querySelector('input[name="payeeId"]')).toHaveValue(members[1].id);
  });

  it("submits once and refreshes balances after success", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ json: async () => ({ settlementId: "settlement-1" }), ok: true } as Response);
    render(<SettlementForm currencies={["INR"]} defaults={{
      amount: "8",
    }} groupId="group-1" payee={members[1]} payer={members[0]} />);

    fireEvent.click(screen.getByRole("button", { name: "Record settlement" }));
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/groups/group-1/balances");
    expect(refresh).toHaveBeenCalled();
    expect(JSON.parse(jest.mocked(global.fetch).mock.calls[0][1]?.body as string)).toMatchObject({
      payeeId: members[1].id,
    });
    expect(JSON.parse(jest.mocked(global.fetch).mock.calls[0][1]?.body as string)).not.toHaveProperty("payerId");
  });

  it("preserves the form and shows a server error", async () => {
    jest.mocked(global.fetch).mockResolvedValue({ json: async () => ({ message: "Currency is not available." }), ok: false } as Response);
    render(<SettlementForm currencies={["INR"]} defaults={{
      amount: "8",
    }} groupId="group-1" payee={members[1]} payer={members[0]} />);
    fireEvent.click(screen.getByRole("button", { name: "Record settlement" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Currency is not available.");
    expect(screen.getByLabelText("Amount")).toHaveValue("8");
  });
});
