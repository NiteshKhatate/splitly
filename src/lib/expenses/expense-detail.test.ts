import { getExpenseDetail } from "./expense-detail";

describe("getExpenseDetail", () => {
  it("scopes lookup to an active expense and authorized group member", async () => {
    const database = {
      activityEvent: { findMany: jest.fn().mockResolvedValue([]) },
      expense: { findFirst: jest.fn().mockResolvedValue(null) },
    };

    const result = await getExpenseDetail(database as never, "expense-1", "user-1");

    expect(result).toEqual({ detail: null, error: { message: "Expense not found." } });
    expect(database.expense.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { deletedAt: null, id: "expense-1", group: { members: { some: { userId: "user-1" } } } },
    }));
    expect(database.activityEvent.findMany).not.toHaveBeenCalled();
  });

  it("returns financial details, exact edit values, permissions, and structured activity", async () => {
    const database = {
      activityEvent: { findMany: jest.fn().mockResolvedValue([{
        actor: { name: "Alex" }, createdAt: new Date("2026-09-04T10:00:00Z"), type: "EXPENSE_CREATED",
      }]) },
      expense: { findFirst: jest.fn().mockResolvedValue({
        category: "DINING", createdBy: "user-1", currency: "INR",
        date: new Date("2026-09-04T00:00:00Z"), description: "Dinner",
        group: { id: "group-1", name: "Flatmates", members: [
          { role: "MEMBER", user: { id: "user-1", name: "Alex" }, userId: "user-1" },
          { role: "MEMBER", user: { id: "user-2", name: "Sam" }, userId: "user-2" },
        ] },
        id: "expense-1", notes: "Friday", payments: [
          { amountMinor: 1000, payer: { id: "user-1", name: "Alex" } },
        ],
        shares: [
          { owedMinor: 500, participant: { id: "user-1", name: "Alex" }, splitMethod: "EQUAL" },
          { owedMinor: 500, participant: { id: "user-2", name: "Sam" }, splitMethod: "EQUAL" },
        ],
        totalMinor: 1000, updatedAt: new Date("2026-09-04T10:00:00Z"),
      }) },
    };

    const result = await getExpenseDetail(database as never, "expense-1", "user-1");

    expect(result.error).toBeNull();
    expect(result.detail).toMatchObject({
      canManage: true,
      description: "Dinner",
      payments: [{ amount: "₹10.00", name: "Alex" }],
      shares: [{ amount: "₹5.00", name: "Alex" }, { amount: "₹5.00", name: "Sam" }],
      splitMethod: "Equal",
      total: "₹10.00",
      initialValues: { splitMethod: "EXACT" },
    });
    expect(result.detail?.activity[0]).toMatchObject({ actor: "Alex", label: "created this expense" });
  });
});
