import type { ExpenseCategory, Prisma, PrismaClient, SplitMethod } from "@prisma/client";

import { ExpenseCreationError, prepareExpenseData } from "./create-expense";

export type ExpenseMutationDatabase = Pick<PrismaClient, "$transaction">;

function requireManager(
  expense: { createdBy: string; group: { members: { role: string }[] } } | null,
  actorId: string,
) {
  if (!expense) throw new ExpenseCreationError("Expense not found.", "NOT_FOUND");
  const membership = expense.group.members[0];
  if (!membership) throw new ExpenseCreationError("Expense not found.", "NOT_FOUND");
  if (expense.createdBy !== actorId && membership.role !== "OWNER") {
    throw new ExpenseCreationError("You do not have permission to manage this expense.", "FORBIDDEN");
  }
}

export async function updateExpense(
  database: ExpenseMutationDatabase,
  expenseId: string,
  actorId: string,
  input: unknown,
) {
  const prepared = prepareExpenseData(input);

  return database.$transaction(async (transaction) => {
    const expense = await transaction.expense.findFirst({
      where: { deletedAt: null, id: expenseId },
      select: {
        createdBy: true,
        group: { select: { members: { where: { userId: actorId }, select: { role: true } } } },
        groupId: true,
      },
    });
    requireManager(expense, actorId);

    const referencedIds = [...new Set([
      ...prepared.payerAmounts.map(({ payerId }) => payerId),
      ...prepared.shares.map(({ participantId }) => participantId),
    ])];
    const members = await transaction.groupMember.findMany({
      where: { groupId: expense!.groupId, userId: { in: referencedIds } },
      select: { userId: true },
    });
    if (new Set(members.map(({ userId }) => userId)).size !== referencedIds.length) {
      throw new ExpenseCreationError("Every payer and participant must be a group member.", "INVALID_INPUT");
    }

    await transaction.expense.update({
      where: { id: expenseId },
      data: {
        category: prepared.data.category as ExpenseCategory,
        currency: prepared.data.currency,
        date: new Date(`${prepared.data.date}T00:00:00.000Z`),
        description: prepared.data.description,
        notes: prepared.data.notes || null,
        totalMinor: prepared.totalMinor,
      },
    });
    await transaction.expensePayment.deleteMany({ where: { expenseId } });
    await transaction.expenseShare.deleteMany({ where: { expenseId } });
    await transaction.expensePayment.createMany({
      data: prepared.payerAmounts.map(({ amountMinor, payerId }) => ({ amountMinor, expenseId, payerId })),
    });
    await transaction.expenseShare.createMany({
      data: prepared.shares.map(({ owedMinor, participantId }) => ({
        expenseId,
        owedMinor,
        participantId,
        splitMethod: prepared.data.splitMethod as SplitMethod,
      })),
    });
    await transaction.activityEvent.create({
      data: {
        actorId,
        entityId: expenseId,
        entityType: "EXPENSE",
        groupId: expense!.groupId,
        metadata: { currency: prepared.data.currency, description: prepared.data.description, totalMinor: prepared.totalMinor } as Prisma.InputJsonValue,
        type: "EXPENSE_UPDATED",
      },
    });

    return { expenseId, groupId: expense!.groupId };
  });
}

export async function deleteExpense(
  database: ExpenseMutationDatabase,
  expenseId: string,
  actorId: string,
) {
  return database.$transaction(async (transaction) => {
    const expense = await transaction.expense.findFirst({
      where: { deletedAt: null, id: expenseId },
      select: {
        createdBy: true,
        description: true,
        group: { select: { members: { where: { userId: actorId }, select: { role: true } } } },
        groupId: true,
      },
    });
    requireManager(expense, actorId);

    await transaction.expense.update({
      where: { id: expenseId },
      data: { deletedAt: new Date() },
    });
    await transaction.activityEvent.create({
      data: {
        actorId,
        entityId: expenseId,
        entityType: "EXPENSE",
        groupId: expense!.groupId,
        metadata: { description: expense!.description } as Prisma.InputJsonValue,
        type: "EXPENSE_DELETED",
      },
    });
    return { groupId: expense!.groupId };
  });
}
