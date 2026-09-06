import { ExpenseExportError, exportExpensesCsv } from "./expense-csv";

function database({ expenses = [], group = { id: "00000000-0000-4000-8000-000000000001", name: "Flat Mates" } }: { expenses?: unknown[]; group?: unknown } = {}) {
  return {
    expense: { findMany: jest.fn().mockResolvedValue(expenses) },
    group: { findFirst: jest.fn().mockResolvedValue(group) },
  };
}

const filters = { groupId: "00000000-0000-4000-8000-000000000001" };

describe("exportExpensesCsv", () => {
  it("requires membership before querying financial data", async () => {
    const db = database({ group: null });

    await expect(exportExpensesCsv(db as never, "user-1", filters)).rejects.toEqual(
      expect.objectContaining<Partial<ExpenseExportError>>({ code: "NOT_FOUND" }),
    );
    expect(db.group.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: filters.groupId, members: { some: { userId: "user-1" } } },
    }));
    expect(db.expense.findMany).not.toHaveBeenCalled();
  });

  it("exports exact minor-unit values and safely escapes spreadsheet content", async () => {
    const db = database({ expenses: [{
      category: "GROCERIES",
      currency: "INR",
      date: new Date("2026-09-05T00:00:00.000Z"),
      description: '=SUM(1,2) "groceries"',
      id: "expense-1",
      notes: "line one\nline two",
      payments: [{ amountMinor: 1001, payer: { name: "Alex" } }],
      shares: [{ owedMinor: 1001, participant: { name: "Sam" } }],
      totalMinor: 1001,
    }] });

    const result = await exportExpensesCsv(db as never, "user-1", filters);

    expect(result.fileName).toBe("flat-mates-expenses.csv");
    expect(result.csv).toContain('"10.01"');
    expect(result.csv).toContain('"Alex: 10.01"');
    expect(result.csv).toContain('"\'=SUM(1,2) ""groceries"""');
    expect(result.csv).toContain('"line one line two"');
  });

  it("applies inclusive date filters", async () => {
    const db = database();
    await exportExpensesCsv(db as never, "user-1", { ...filters, from: "2026-09-01", to: "2026-09-30" });
    expect(db.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      date: { gte: new Date("2026-09-01T00:00:00.000Z"), lte: new Date("2026-09-30T00:00:00.000Z") },
    }) }));
  });
});
