import type { ExpenseCategory, Prisma, PrismaClient, SplitMethod } from "@prisma/client";

import { ExpenseCreationError, prepareExpenseData } from "./create-expense";

export type ExpenseMutationDatabase = Pick<PrismaClient, "$transaction">;

function parseExpectedVersion(value: string): Date {
  const version = new Date(value);
  if (!value || Number.isNaN(version.getTime()) || version.toISOString() !== value) {
    throw new ExpenseCreationError("Refresh the expense and try again.", "INVALID_INPUT");
  }
  return version;
}

function sameMinorAmounts(
  left: { amountMinor: number; memberId: string }[],
  right: { amountMinor: number; memberId: string }[],
): boolean {
  if (left.length !== right.length) return false;
  const expected = new Map(left.map((item) => [item.memberId, item.amountMinor]));
  return right.every((item) => expected.get(item.memberId) === item.amountMinor);
}

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
  expectedUpdatedAt: string,
) {
  const prepared = prepareExpenseData(input);
  const expectedVersion = parseExpectedVersion(expectedUpdatedAt);

  return database.$transaction(async (transaction) => {
    const expense = await transaction.expense.findFirst({
      where: { deletedAt: null, id: expenseId },
      select: {
        createdBy: true,
        group: {
          select: {
            defaultCurrency: true,
            members: { where: { userId: actorId }, select: { role: true } },
          },
        },
        groupId: true,
        payments: { select: { amountMinor: true, payerId: true } },
        shares: { select: { owedMinor: true, participantId: true, splitMethod: true } },
        totalMinor: true,
        updatedAt: true,
      },
    });
    requireManager(expense, actorId);
    if (expense!.updatedAt.getTime() !== expectedVersion.getTime()) {
      throw new ExpenseCreationError(
        "This expense changed after you opened it. Refresh and try again.",
        "CONFLICT",
      );
    }
    if (prepared.data.currency !== expense!.group.defaultCurrency) {
      throw new ExpenseCreationError("Currency must match the group currency.", "INVALID_INPUT");
    }

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

    const update = await transaction.expense.updateMany({
      where: { deletedAt: null, id: expenseId, updatedAt: expectedVersion },
      data: {
        category: prepared.data.category as ExpenseCategory,
        currency: prepared.data.currency,
        date: new Date(`${prepared.data.date}T00:00:00.000Z`),
        description: prepared.data.description,
        notes: prepared.data.notes || null,
        totalMinor: prepared.totalMinor,
      },
    });
    if (update.count !== 1) {
      throw new ExpenseCreationError(
        "This expense changed after you opened it. Refresh and try again.",
        "CONFLICT",
      );
    }

    const originalMethods = new Set(expense!.shares.map(({ splitMethod }) => splitMethod));
    const financialShapeUnchanged = expense!.totalMinor === prepared.totalMinor
      && sameMinorAmounts(
        expense!.payments.map(({ amountMinor, payerId }) => ({ amountMinor, memberId: payerId })),
        prepared.payerAmounts.map(({ amountMinor, payerId }) => ({ amountMinor, memberId: payerId })),
      )
      && sameMinorAmounts(
        expense!.shares.map(({ owedMinor, participantId }) => ({ amountMinor: owedMinor, memberId: participantId })),
        prepared.shares.map(({ owedMinor, participantId }) => ({ amountMinor: owedMinor, memberId: participantId })),
      );
    const preservedMethod = originalMethods.size === 1
      ? originalMethods.values().next().value
      : undefined;
    const splitMethod = prepared.data.splitMethod === "EXACT"
      && financialShapeUnchanged
      && preservedMethod
      ? preservedMethod
      : prepared.data.splitMethod;

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
        splitMethod: splitMethod as SplitMethod,
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
  expectedUpdatedAt: string,
) {
  const expectedVersion = parseExpectedVersion(expectedUpdatedAt);
  return database.$transaction(async (transaction) => {
    const expense = await transaction.expense.findFirst({
      where: { deletedAt: null, id: expenseId },
      select: {
        createdBy: true,
        description: true,
        group: { select: { members: { where: { userId: actorId }, select: { role: true } } } },
        groupId: true,
        updatedAt: true,
      },
    });
    requireManager(expense, actorId);
    if (expense!.updatedAt.getTime() !== expectedVersion.getTime()) {
      throw new ExpenseCreationError(
        "This expense changed after you opened it. Refresh and try again.",
        "CONFLICT",
      );
    }

    const deletion = await transaction.expense.updateMany({
      where: { deletedAt: null, id: expenseId, updatedAt: expectedVersion },
      data: { deletedAt: new Date() },
    });
    if (deletion.count !== 1) {
      throw new ExpenseCreationError(
        "This expense changed after you opened it. Refresh and try again.",
        "CONFLICT",
      );
    }
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
