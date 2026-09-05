import { getDashboardOverview } from "./overview";

const userId = "user-1";

function createDatabase({ expenses = [], groups = [], settlements = [] }: { expenses?: unknown[]; groups?: unknown[]; settlements?: unknown[] } = {}) {
  return {
    expense: { findMany: jest.fn().mockResolvedValue(expenses) },
    group: { findMany: jest.fn().mockResolvedValue(groups) },
    settlement: { findMany: jest.fn().mockResolvedValue(settlements) },
  };
}

describe("getDashboardOverview", () => {
  it("returns authorized recent expenses with user-specific impacts", async () => {
    const database = createDatabase({
      expenses: [
        {
          currency: "INR", createdAt: new Date("2026-09-04T10:00:00.000Z"), date: new Date("2026-09-04T00:00:00.000Z"), description: "Groceries",
          group: { name: "Flatmates" }, id: "expense-1", payments: [{ amountMinor: 1000 }],
          shares: [{ owedMinor: 400 }], totalMinor: 1000,
        },
        {
          currency: "INR", createdAt: new Date("2026-09-03T10:00:00.000Z"), date: new Date("2026-09-03T00:00:00.000Z"), description: "Tea",
          group: { name: "Office" }, id: "expense-2", payments: [{ amountMinor: 200 }],
          shares: [{ owedMinor: 200 }], totalMinor: 200,
        },
      ],
    });

    const result = await getDashboardOverview(database as never, userId);

    expect(result.expenses).toEqual([
      expect.objectContaining({ description: "Groceries", impact: "you lent ₹6", impactTone: "success", total: "₹10" }),
      expect.objectContaining({ description: "Tea", impact: "no balance change", impactTone: "neutral" }),
    ]);
    expect(database.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 4,
      where: { deletedAt: null, group: { members: { some: { userId } } } },
    }));
  });

  it("includes authorized settlement activity in chronological order", async () => {
    const database = createDatabase({
      expenses: [{
        currency: "INR", createdAt: new Date("2026-09-03T10:00:00.000Z"), date: new Date("2026-09-03T00:00:00.000Z"),
        description: "Tea", group: { name: "Flatmates" }, id: "expense-1", payments: [], shares: [], totalMinor: 200,
      }],
      settlements: [{
        amountMinor: 300, createdAt: new Date("2026-09-04T10:00:00.000Z"), currency: "INR",
        date: new Date("2026-09-04T00:00:00.000Z"), group: { name: "Flatmates" }, id: "settlement-1",
        payee: { id: userId, name: "Alex" }, payer: { id: "user-2", name: "Sam" },
      }],
    });

    const result = await getDashboardOverview(database as never, userId);

    expect(result.expenses[0]).toMatchObject({
      description: "Sam paid Alex", impact: "you received ₹3", impactTone: "success",
    });
    expect(database.settlement.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { group: { members: { some: { userId } } } },
    }));
  });

  it("derives only the current user's deterministic suggested transfers", async () => {
    const database = createDatabase({ groups: [{
      defaultCurrency: "INR",
      expenses: [{
        currency: "INR",
        payments: [{ amountMinor: 1200, payerId: userId }],
        shares: [{ owedMinor: 400, participantId: userId }, { owedMinor: 400, participantId: "user-2" }, { owedMinor: 400, participantId: "user-3" }],
        totalMinor: 1200,
      }],
      id: "group-1",
      members: [
        { user: { id: userId, name: "Alex" } },
        { user: { id: "user-2", name: "Sam" } },
        { user: { id: "user-3", name: "Jo" } },
      ],
      name: "Flatmates",
      settlements: [{ amountMinor: 100, currency: "INR", payeeId: userId, payerId: "user-2" }],
    }] });

    const result = await getDashboardOverview(database as never, userId);

    expect(result.debts).toEqual([
      expect.objectContaining({ amount: "₹3", description: "Sam owes you in Flatmates", tone: "success" }),
      expect.objectContaining({ amount: "₹4", description: "Jo owes you in Flatmates", tone: "success" }),
    ]);
  });

  it("returns a safe unified error if either dashboard query fails", async () => {
    const database = createDatabase();
    database.group.findMany.mockRejectedValue(new Error("database unavailable"));
    await expect(getDashboardOverview(database as never, userId)).resolves.toEqual({
      debts: [], expenses: [], error: { message: "Dashboard activity could not be loaded." },
    });
  });
});
