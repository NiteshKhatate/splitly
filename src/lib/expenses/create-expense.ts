import type { ExpenseCategory, Prisma, PrismaClient, SplitMethod } from "@prisma/client";

import { calculateSplit, type SplitCalculationInput } from "./split-calculator";
import {
  expenseFormSchema,
  parseDecimalToMinor,
  parsePercentageToBasisPoints,
  type ExpenseFormValues,
} from "@/lib/validations/expenses";

export type ExpenseDatabase = Pick<PrismaClient, "$transaction">;

export class ExpenseCreationError extends Error {
  constructor(
    message: string,
    readonly code: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND",
  ) {
    super(message);
    this.name = "ExpenseCreationError";
  }
}

function buildSplitInput(data: ExpenseFormValues, totalMinor: number): SplitCalculationInput {
  const included = data.participants.filter(({ included }) => included);
  if (data.splitMethod === "EQUAL") {
    return { method: "EQUAL", participantIds: included.map(({ memberId }) => memberId), totalMinor };
  }
  if (data.splitMethod === "EXACT") {
    return {
      allocations: included.map(({ exactAmount, memberId }) => ({
        amountMinor: parseDecimalToMinor(exactAmount), participantId: memberId,
      })),
      method: "EXACT", totalMinor,
    };
  }
  if (data.splitMethod === "PERCENTAGE") {
    return {
      allocations: included.map(({ memberId, percentage }) => ({
        participantId: memberId, percentageBasisPoints: parsePercentageToBasisPoints(percentage),
      })),
      method: "PERCENTAGE", totalMinor,
    };
  }
  return {
    allocations: included.map(({ memberId, shares }) => ({
      participantId: memberId, shares: Number(shares),
    })),
    method: "SHARES", totalMinor,
  };
}

export async function createExpense(
  database: ExpenseDatabase,
  groupId: string,
  actorId: string,
  input: unknown,
): Promise<{ expenseId: string }> {
  const validation = expenseFormSchema.safeParse(input);
  if (!validation.success) {
    throw new ExpenseCreationError("The expense details are invalid.", "INVALID_INPUT");
  }

  const data = validation.data;
  const totalMinor = parseDecimalToMinor(data.amount);
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) {
    throw new ExpenseCreationError("The expense amount must be greater than zero.", "INVALID_INPUT");
  }

  const payerAmounts = data.payers
    .map(({ amount, memberId }) => ({ amountMinor: parseDecimalToMinor(amount), payerId: memberId }))
    .filter(({ amountMinor }) => amountMinor > 0);
  if (payerAmounts.some(({ amountMinor }) => !Number.isSafeInteger(amountMinor))) {
    throw new ExpenseCreationError("A payer amount is invalid.", "INVALID_INPUT");
  }
  if (payerAmounts.reduce((sum, payer) => sum + payer.amountMinor, 0) !== totalMinor) {
    throw new ExpenseCreationError("Payer amounts must equal the expense total.", "INVALID_INPUT");
  }

  let shares;
  try {
    shares = calculateSplit(buildSplitInput(data, totalMinor));
  } catch {
    throw new ExpenseCreationError("Split amounts must reconcile with the expense total.", "INVALID_INPUT");
  }

  return database.$transaction(async (transaction) => {
    const group = await transaction.group.findUnique({
      where: { id: groupId }, select: { id: true },
    });
    if (!group) throw new ExpenseCreationError("Group not found.", "NOT_FOUND");

    const referencedMemberIds = [...new Set([
      actorId,
      ...payerAmounts.map(({ payerId }) => payerId),
      ...shares.map(({ participantId }) => participantId),
    ])];
    const memberships = await transaction.groupMember.findMany({
      where: { groupId, userId: { in: referencedMemberIds } }, select: { userId: true },
    });
    const activeIds = new Set(memberships.map(({ userId }) => userId));
    if (!activeIds.has(actorId)) {
      throw new ExpenseCreationError("You do not have permission to add expenses to this group.", "FORBIDDEN");
    }
    if (referencedMemberIds.some((memberId) => !activeIds.has(memberId))) {
      throw new ExpenseCreationError("Every payer and participant must be a group member.", "INVALID_INPUT");
    }

    const expense = await transaction.expense.create({
      data: {
        category: data.category as ExpenseCategory,
        createdBy: actorId,
        currency: data.currency,
        date: new Date(`${data.date}T00:00:00.000Z`),
        description: data.description,
        groupId,
        notes: data.notes || null,
        totalMinor,
      },
      select: { id: true },
    });
    await transaction.expensePayment.createMany({
      data: payerAmounts.map(({ amountMinor, payerId }) => ({ amountMinor, expenseId: expense.id, payerId })),
    });
    await transaction.expenseShare.createMany({
      data: shares.map(({ owedMinor, participantId }) => ({
        expenseId: expense.id, owedMinor, participantId, splitMethod: data.splitMethod as SplitMethod,
      })),
    });
    await transaction.activityEvent.create({
      data: {
        actorId,
        entityId: expense.id,
        entityType: "EXPENSE",
        groupId,
        metadata: { currency: data.currency, description: data.description, totalMinor } as Prisma.InputJsonValue,
        type: "EXPENSE_CREATED",
      },
    });

    return { expenseId: expense.id };
  });
}
