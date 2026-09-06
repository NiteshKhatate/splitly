import type { PrismaClient } from "@prisma/client";

import type { ExpenseExportFilters } from "@/lib/validations/exports";

export type ExpenseExportDatabase = Pick<PrismaClient, "expense" | "group">;

export class ExpenseExportError extends Error {
  code: "NOT_FOUND" | "QUERY_FAILED";

  constructor(message: string, code: ExpenseExportError["code"]) {
    super(message);
    this.code = code;
  }
}

function minorToDecimal(amountMinor: number): string {
  const sign = amountMinor < 0 ? "-" : "";
  const absolute = Math.abs(amountMinor);
  return `${sign}${Math.floor(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

function csvCell(value: string): string {
  const normalized = value.replace(/\r\n?|\n/g, " ");
  const formulaSafe = /^[=+\-@]/.test(normalized) ? `'${normalized}` : normalized;
  return `"${formulaSafe.replace(/"/g, '""')}"`;
}

export async function exportExpensesCsv(
  database: ExpenseExportDatabase,
  userId: string,
  filters: ExpenseExportFilters,
): Promise<{ csv: string; fileName: string }> {
  try {
    const group = await database.group.findFirst({
      select: { id: true, name: true },
      where: { id: filters.groupId, members: { some: { userId } } },
    });
    if (!group) throw new ExpenseExportError("Group not found.", "NOT_FOUND");

    const expenses = await database.expense.findMany({
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      select: {
        category: true,
        currency: true,
        date: true,
        description: true,
        id: true,
        notes: true,
        payments: { select: { amountMinor: true, payer: { select: { name: true } } } },
        shares: { select: { owedMinor: true, participant: { select: { name: true } } } },
        totalMinor: true,
      },
      where: {
        deletedAt: null,
        groupId: group.id,
        ...(filters.from || filters.to ? {
          date: {
            ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
            ...(filters.to ? { lte: new Date(`${filters.to}T00:00:00.000Z`) } : {}),
          },
        } : {}),
      },
    });

    const header = ["Expense ID", "Date", "Description", "Category", "Currency", "Total", "Payers", "Participants", "Notes"];
    const rows = expenses.map((expense) => [
      expense.id,
      expense.date.toISOString().slice(0, 10),
      expense.description,
      expense.category,
      expense.currency,
      minorToDecimal(expense.totalMinor),
      expense.payments.map(({ amountMinor, payer }) => `${payer.name}: ${minorToDecimal(amountMinor)}`).join("; "),
      expense.shares.map(({ owedMinor, participant }) => `${participant.name}: ${minorToDecimal(owedMinor)}`).join("; "),
      expense.notes ?? "",
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
    const safeGroupName = group.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "group";
    return { csv, fileName: `${safeGroupName}-expenses.csv` };
  } catch (error) {
    if (error instanceof ExpenseExportError) throw error;
    throw new ExpenseExportError("Expenses could not be exported.", "QUERY_FAILED");
  }
}
