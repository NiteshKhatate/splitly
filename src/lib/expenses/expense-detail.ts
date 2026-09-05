import type { PrismaClient } from "@prisma/client";

import type { ExpenseFormValues } from "@/lib/validations/expenses";

export type ExpenseDetailDatabase = Pick<PrismaClient, "activityEvent" | "expense">;

function minorInput(amountMinor: number): string {
  const whole = Math.floor(amountMinor / 100);
  const fraction = String(amountMinor % 100).padStart(2, "0");
  return fraction === "00" ? String(whole) : `${whole}.${fraction}`;
}

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { currency, style: "currency" }).format(amountMinor / 100);
}

export async function getExpenseDetail(
  database: ExpenseDetailDatabase,
  expenseId: string,
  userId: string,
) {
  try {
    const expense = await database.expense.findFirst({
      where: { deletedAt: null, id: expenseId, group: { members: { some: { userId } } } },
      select: {
        category: true,
        createdBy: true,
        currency: true,
        date: true,
        description: true,
        group: {
          select: {
            id: true,
            members: {
              orderBy: { joinedAt: "asc" },
              select: { role: true, user: { select: { id: true, name: true } }, userId: true },
            },
            name: true,
          },
        },
        id: true,
        notes: true,
        payments: { select: { amountMinor: true, payer: { select: { id: true, name: true } } } },
        shares: { select: { owedMinor: true, participant: { select: { id: true, name: true } }, splitMethod: true } },
        totalMinor: true,
        updatedAt: true,
      },
    });

    if (!expense) return { detail: null, error: { message: "Expense not found." } };
    const activity = await database.activityEvent.findMany({
      where: { entityId: expenseId, entityType: "EXPENSE" },
      orderBy: { createdAt: "desc" },
      select: { actor: { select: { name: true } }, createdAt: true, type: true },
      take: 10,
    });
    const membership = expense.group.members.find(({ userId: memberId }) => memberId === userId);
    const splitMethod = expense.shares[0]?.splitMethod ?? "EXACT";
    const initialValues: ExpenseFormValues = {
      amount: minorInput(expense.totalMinor),
      category: expense.category,
      currency: expense.currency,
      date: expense.date.toISOString().slice(0, 10),
      description: expense.description,
      notes: expense.notes ?? "",
      participants: expense.group.members.map(({ user }) => {
        const share = expense.shares.find(({ participant }) => participant.id === user.id);
        return {
          exactAmount: share ? minorInput(share.owedMinor) : "",
          included: Boolean(share),
          memberId: user.id,
          percentage: "",
          shares: "1",
        };
      }),
      payers: expense.group.members.map(({ user }) => {
        const payment = expense.payments.find(({ payer }) => payer.id === user.id);
        return { amount: payment ? minorInput(payment.amountMinor) : "", memberId: user.id };
      }),
      splitMethod: "EXACT",
    };

    return {
      detail: {
        canManage: expense.createdBy === userId || membership?.role === "OWNER",
        activity: activity.map((event) => ({
          actor: event.actor.name,
          date: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(event.createdAt),
          label: event.type === "EXPENSE_CREATED" ? "created this expense" : event.type === "EXPENSE_UPDATED" ? "updated this expense" : "deleted this expense",
        })),
        category: expense.category.charAt(0) + expense.category.slice(1).toLowerCase(),
        currency: expense.currency,
        date: new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "UTC" }).format(expense.date),
        description: expense.description,
        groupId: expense.group.id,
        groupName: expense.group.name,
        id: expense.id,
        initialValues,
        members: expense.group.members.map(({ user }) => user),
        notes: expense.notes,
        payments: expense.payments.map(({ amountMinor, payer }) => ({ amount: formatMoney(amountMinor, expense.currency), name: payer.name })),
        shares: expense.shares.map(({ owedMinor, participant }) => ({ amount: formatMoney(owedMinor, expense.currency), name: participant.name })),
        splitMethod: splitMethod.charAt(0) + splitMethod.slice(1).toLowerCase(),
        total: formatMoney(expense.totalMinor, expense.currency),
        updatedAt: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(expense.updatedAt),
      },
      error: null,
    };
  } catch {
    return { detail: null, error: { message: "Expense could not be loaded." } };
  }
}
