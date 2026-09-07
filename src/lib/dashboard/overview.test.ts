import { getDashboardOverview } from "./overview";

const userId = "user-1";

function createDatabase({ groups = [] }: { groups?: unknown[] } = {}) {
  return {
    group: { findMany: jest.fn().mockResolvedValue(groups) },
  };
}

describe("getDashboardOverview", () => {
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
      debts: [], error: { message: "Dashboard balances could not be loaded." },
    });
  });
});
