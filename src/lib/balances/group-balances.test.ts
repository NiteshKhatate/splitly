import {
  formatMinorUnits,
  getCurrentUserGroupBalances,
  parseAmountToMinorUnits,
} from "./group-balances";

function createDatabase({
  expenses = [],
  settlements = [],
}: {
  expenses?: unknown[];
  settlements?: unknown[];
} = {}) {
  return {
    expense: {
      findMany: jest.fn().mockResolvedValue(expenses),
    },
    settlement: {
      findMany: jest.fn().mockResolvedValue(settlements),
    },
  };
}

describe("group balance calculations", () => {
  it.each([
    ["125", 12500],
    ["125.5", 12550],
    ["125.05", 12505],
    ["125.567", 12556],
    ["  +1.2 ", 120],
    ["-10.25", -1025],
    ["", 0],
    ["not-a-number", 0],
  ])("parses %p into minor units", (amount, expected) => {
    expect(parseAmountToMinorUnits(amount)).toBe(expected);
  });

  it("formats minor units as INR", () => {
    expect(formatMinorUnits(0)).toBe("₹0");
    expect(formatMinorUnits(12550)).toBe("₹125.5");
    expect(formatMinorUnits(12505)).toBe("₹125.05");
  });

  it("returns an empty balance map without querying Prisma when there are no groups", async () => {
    const database = createDatabase();

    const result = await getCurrentUserGroupBalances(database as never, "user-1", []);

    expect(result).toEqual({ balances: new Map(), error: null });
    expect(database.expense.findMany).not.toHaveBeenCalled();
    expect(database.settlement.findMany).not.toHaveBeenCalled();
  });

  it("combines multiple payments, shares, and settlements into per-group balances", async () => {
    const database = createDatabase({
      expenses: [
        {
          groupId: "group-1",
          payments: [{ amountMinor: 6000 }, { amountMinor: 4000 }],
          shares: [{ owedMinor: 2500 }],
        },
        {
          groupId: "group-1",
          payments: [],
          shares: [{ owedMinor: 2000 }],
        },
        {
          groupId: "group-2",
          payments: [],
          shares: [{ owedMinor: 3000 }],
        },
      ],
      settlements: [
        { groupId: "group-1", payerId: "user-2", payeeId: "user-1", amountMinor: 1500 },
        { groupId: "group-1", payerId: "user-1", payeeId: "user-2", amountMinor: 500 },
        { groupId: "group-2", payerId: "user-1", payeeId: "user-3", amountMinor: 1000 },
      ],
    });

    const result = await getCurrentUserGroupBalances(
      database as never,
      "user-1",
      ["group-1", "group-2"],
    );

    expect(result.error).toBeNull();
    expect(result.balances.get("group-1")).toMatchObject({
      amountInMinorUnits: 4500,
      label: "You are owed ₹45",
      tone: "success",
    });
    expect(result.balances.get("group-2")).toMatchObject({
      amountInMinorUnits: -2000,
      label: "You owe ₹20",
      tone: "danger",
    });
  });

  it("uses the new ledger relations and excludes soft-deleted expenses", async () => {
    const database = createDatabase();

    await getCurrentUserGroupBalances(database as never, "user-1", ["group-1"]);

    expect(database.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          groupId: { in: ["group-1"] },
        },
        select: expect.objectContaining({
          payments: expect.any(Object),
          shares: expect.any(Object),
        }),
      }),
    );
  });

  it("returns a safe error when the ledger query fails", async () => {
    const database = createDatabase();
    database.expense.findMany.mockRejectedValue(new Error("missing legacy amount column"));

    const result = await getCurrentUserGroupBalances(database as never, "user-1", ["group-1"]);

    expect(result).toEqual({
      balances: new Map(),
      error: { message: "Group balances could not be loaded." },
    });
  });
});
