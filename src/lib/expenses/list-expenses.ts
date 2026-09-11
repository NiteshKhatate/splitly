import type { ExpenseCategory, Prisma, PrismaClient } from "@prisma/client";

import type { ExpenseFilters } from "@/lib/validations/expenses";

export type ExpenseListDatabase = Pick<PrismaClient, "expense" | "group">;

export type ExpenseListItem = {
  amount: string;
  category: string;
  currency: string;
  date: string;
  description: string;
  id: string;
  participants: string[];
  payers: string[];
};

export type ExpenseListGroup = {
  currency: string;
  id: string;
  members: { id: string; name: string }[];
  name: string;
};

function formatMinor(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amountMinor / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function buildWhere(groupId: string, filters: ExpenseFilters): Prisma.ExpenseWhereInput {
  const where: Prisma.ExpenseWhereInput = { deletedAt: null, groupId };

  if (filters.search) {
    where.description = { contains: filters.search, mode: "insensitive" };
  }
  if (filters.category) {
    where.category = filters.category as ExpenseCategory;
  }
  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T00:00:00.000Z`) } : {}),
    };
  }
  if (filters.memberId) {
    where.OR = [
      { payments: { some: { payerId: filters.memberId } } },
      { shares: { some: { participantId: filters.memberId } } },
    ];
  }

  return where;
}

export async function getGroupExpenses(
  database: ExpenseListDatabase,
  groupId: string,
  userId: string,
  filters: ExpenseFilters,
): Promise<
  | { error: null; expenses: ExpenseListItem[]; group: ExpenseListGroup }
  | { error: { message: string }; expenses: []; group: null }
> {
  try {
    const group = await database.group.findFirst({
      where: { id: groupId, members: { some: { userId } } },
      select: {
        defaultCurrency: true,
        id: true,
        members: {
          orderBy: { joinedAt: "asc" },
          select: { user: { select: { id: true, name: true } } },
        },
        name: true,
      },
    });

    if (!group) {
      return { error: { message: "Group not found." }, expenses: [], group: null };
    }

    const expenses = await database.expense.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      select: {
        category: true,
        currency: true,
        date: true,
        description: true,
        id: true,
        payments: { select: { payer: { select: { name: true } } } },
        shares: { select: { participant: { select: { name: true } } } },
        totalMinor: true,
      },
      take: 100,
      where: buildWhere(groupId, filters),
    });

    return {
      error: null,
      expenses: expenses.map((expense) => ({
        amount: formatMinor(expense.totalMinor, expense.currency),
        category: expense.category.charAt(0) + expense.category.slice(1).toLowerCase(),
        currency: expense.currency,
        date: formatDate(expense.date),
        description: expense.description,
        id: expense.id,
        participants: expense.shares.map(({ participant }) => participant.name),
        payers: expense.payments.map(({ payer }) => payer.name),
      })),
      group: {
        currency: group.defaultCurrency,
        id: group.id,
        members: group.members.map(({ user }) => user),
        name: group.name,
      },
    };
  } catch {
    return { error: { message: "Expenses could not be loaded." }, expenses: [], group: null };
  }
}
