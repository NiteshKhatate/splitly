import { getGroupExpenses } from "./list-expenses";

function createDatabase({ group = null, expenses = [] }: { group?: unknown; expenses?: unknown[] } = {}) {
  return {
    expense: { findMany: jest.fn().mockResolvedValue(expenses) },
    group: { findFirst: jest.fn().mockResolvedValue(group) },
  };
}

const group = {
  defaultCurrency: "INR",
  id: "group-1",
  members: [
    { user: { id: "member-1", name: "Alex" } },
    { user: { id: "member-2", name: "Sam" } },
  ],
  name: "Flatmates",
};

describe("getGroupExpenses", () => {
  it("requires group membership before reading expenses", async () => {
    const database = createDatabase();

    const result = await getGroupExpenses(database as never, "group-1", "outsider", {});

    expect(result).toEqual({ error: { message: "Group not found." }, expenses: [], group: null });
    expect(database.group.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "group-1", members: { some: { userId: "outsider" } } },
    }));
    expect(database.expense.findMany).not.toHaveBeenCalled();
  });

  it("maps authorized ledger rows for display", async () => {
    const database = createDatabase({
      group,
      expenses: [{
        category: "GROCERIES",
        currency: "INR",
        date: new Date("2026-09-04T00:00:00.000Z"),
        description: "Weekly groceries",
        id: "expense-1",
        payments: [{ payer: { name: "Alex" } }, { payer: { name: "Sam" } }],
        shares: [{ participant: { name: "Alex" } }, { participant: { name: "Sam" } }],
        totalMinor: 125050,
      }],
    });

    const result = await getGroupExpenses(database as never, "group-1", "member-1", {});

    expect(result.error).toBeNull();
    expect(result.expenses).toEqual([{
      amount: "₹1,250.5",
      category: "Groceries",
      currency: "INR",
      date: "4 Sept 2026",
      description: "Weekly groceries",
      id: "expense-1",
      participants: ["Alex", "Sam"],
      payers: ["Alex", "Sam"],
    }]);
  });

  it("applies search, date, member, and category filters", async () => {
    const database = createDatabase({ group });

    await getGroupExpenses(database as never, "group-1", "member-1", {
      category: "DINING",
      from: "2026-09-01",
      memberId: "00000000-0000-4000-8000-000000000001",
      search: "dinner",
      to: "2026-09-30",
    });

    expect(database.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        OR: [
          { payments: { some: { payerId: "00000000-0000-4000-8000-000000000001" } } },
          { shares: { some: { participantId: "00000000-0000-4000-8000-000000000001" } } },
        ],
        category: "DINING",
        date: {
          gte: new Date("2026-09-01T00:00:00.000Z"),
          lte: new Date("2026-09-30T00:00:00.000Z"),
        },
        deletedAt: null,
        description: { contains: "dinner", mode: "insensitive" },
        groupId: "group-1",
      },
    }));
  });

  it("returns a safe error if Prisma fails", async () => {
    const database = createDatabase({ group });
    database.expense.findMany.mockRejectedValue(new Error("database unavailable"));

    await expect(getGroupExpenses(database as never, "group-1", "member-1", {})).resolves.toEqual({
      error: { message: "Expenses could not be loaded." }, expenses: [], group: null,
    });
  });
});
