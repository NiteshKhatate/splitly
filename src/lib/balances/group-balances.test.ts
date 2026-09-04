import {
  formatMinorUnits,
  getCurrentUserGroupBalances,
  parseAmountToMinorUnits,
} from "./group-balances";

function createQueryResult<T>(data: T, error: { message: string } | null = null) {
  return {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    returns: jest.fn().mockResolvedValue({ data, error }),
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

  it("returns an empty balance map without querying Supabase when there are no groups", async () => {
    const supabase = { from: jest.fn() };

    const result = await getCurrentUserGroupBalances(supabase as never, "user-1", []);

    expect(result).toEqual({ balances: new Map(), error: null });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("combines paid expenses, user splits, and settlements into per-group balances", async () => {
    const expensesQuery = createQueryResult([
      { id: "expense-1", group_id: "group-1", amount: "100.00", paid_by: "user-1" },
      { id: "expense-2", group_id: "group-1", amount: "40.00", paid_by: "user-2" },
      { id: "expense-3", group_id: "group-2", amount: "30.00", paid_by: "user-3" },
    ]);
    const splitsQuery = createQueryResult([
      { expense_id: "expense-1", amount: "25.00" },
      { expense_id: "expense-2", amount: "20.00" },
      { expense_id: "expense-3", amount: "30.00" },
    ]);
    const settlementsQuery = createQueryResult([
      { group_id: "group-1", paid_by: "user-2", paid_to: "user-1", amount: "15.00" },
      { group_id: "group-1", paid_by: "user-1", paid_to: "user-2", amount: "5.00" },
      { group_id: "group-2", paid_by: "user-1", paid_to: "user-3", amount: "10.00" },
    ]);
    const supabase = {
      from: jest.fn((table: string) => {
        if (table === "expenses") return expensesQuery;
        if (table === "expense_splits") return splitsQuery;
        if (table === "settlements") return settlementsQuery;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    const result = await getCurrentUserGroupBalances(
      supabase as never,
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

  it("returns the first Supabase error without calculating balances", async () => {
    const error = { message: "expenses unavailable" };
    const expensesQuery = createQueryResult([], error);
    const supabase = {
      from: jest.fn(() => expensesQuery),
    };

    const result = await getCurrentUserGroupBalances(supabase as never, "user-1", ["group-1"]);

    expect(result).toEqual({ balances: new Map(), error });
  });
});
