import { getDashboardBalanceSummaries } from "./dashboard-balances";

function createDatabase({ expenses = [], settlements = [] }: { expenses?: unknown[]; settlements?: unknown[] } = {}) {
  return {
    expense: { findMany: jest.fn().mockResolvedValue(expenses) },
    settlement: { findMany: jest.fn().mockResolvedValue(settlements) },
  };
}

describe("dashboard balance summaries", () => {
  it("shows a real zero balance when the ledger is empty", async () => {
    const result = await getDashboardBalanceSummaries(createDatabase() as never, "user-1");

    expect(result).toEqual({
      error: null,
      summaries: [{
        currency: "INR",
        net: { amount: "₹0", description: "You're settled up", tone: "neutral" },
        youAreOwed: { amount: "₹0", tone: "neutral" },
        youOwe: { amount: "₹0", tone: "neutral" },
      }],
    });
  });

  it("keeps group debts separate before producing currency totals", async () => {
    const database = createDatabase({
      expenses: [
        { currency: "INR", groupId: "group-1", payments: [{ amountMinor: 1500 }], shares: [{ owedMinor: 500 }] },
        { currency: "INR", groupId: "group-2", payments: [], shares: [{ owedMinor: 400 }] },
      ],
      settlements: [
        { amount: "2.00", group: { defaultCurrency: "INR" }, groupId: "group-1", payeeId: "user-1", payerId: "user-2" },
        { amount: "1.00", group: { defaultCurrency: "INR" }, groupId: "group-2", payeeId: "user-3", payerId: "user-1" },
      ],
    });

    const result = await getDashboardBalanceSummaries(database as never, "user-1");

    expect(result.summaries).toEqual([{
      currency: "INR",
      net: { amount: "+₹5", description: "Overall, you're owed money", tone: "success" },
      youAreOwed: { amount: "₹8", tone: "success" },
      youOwe: { amount: "₹3", tone: "danger" },
    }]);
  });

  it("isolates currencies and only queries ledger rows involving the user", async () => {
    const database = createDatabase({
      expenses: [
        { currency: "USD", groupId: "group-1", payments: [{ amountMinor: 1000 }], shares: [] },
        { currency: "INR", groupId: "group-2", payments: [], shares: [{ owedMinor: 500 }] },
      ],
    });

    const result = await getDashboardBalanceSummaries(database as never, "user-1");

    expect(result.summaries.map(({ currency }) => currency)).toEqual(["INR", "USD"]);
    expect(database.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        deletedAt: null,
        OR: [
          { payments: { some: { payerId: "user-1" } } },
          { shares: { some: { participantId: "user-1" } } },
        ],
      },
    }));
  });

  it("returns a safe error when the ledger cannot be loaded", async () => {
    const database = createDatabase();
    database.expense.findMany.mockRejectedValue(new Error("database unavailable"));

    await expect(getDashboardBalanceSummaries(database as never, "user-1")).resolves.toEqual({
      summaries: [],
      error: { message: "Dashboard balances could not be loaded." },
    });
  });
});
