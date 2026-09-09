import type { Prisma, PrismaClient } from "@prisma/client";

import { parseDecimalToMinor } from "@/lib/validations/expenses";
import { settlementFormSchema } from "@/lib/validations/settlements";

export class SettlementError extends Error {
  constructor(message: string, readonly code: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND") {
    super(message);
  }
}

type ExistingSettlement = {
  amountMinor: number;
  createdBy: string;
  currency: string;
  date: Date;
  groupId: string;
  id: string;
  note: string | null;
  payeeId: string;
  payerId: string;
};

function matchingRetry(
  settlement: ExistingSettlement,
  expected: Omit<ExistingSettlement, "id">,
): boolean {
  return settlement.amountMinor === expected.amountMinor
    && settlement.createdBy === expected.createdBy
    && settlement.currency === expected.currency
    && settlement.date.getTime() === expected.date.getTime()
    && settlement.groupId === expected.groupId
    && settlement.note === expected.note
    && settlement.payeeId === expected.payeeId
    && settlement.payerId === expected.payerId;
}

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

export async function createSettlement(
  database: Pick<PrismaClient, "$transaction" | "settlement">,
  groupId: string,
  actorId: string,
  input: unknown,
) {
  const parsed = settlementFormSchema.safeParse(input);
  if (!parsed.success) throw new SettlementError("The settlement details are invalid.", "INVALID_INPUT");
  const data = parsed.data;
  const amountMinor = parseDecimalToMinor(data.amount);
  const date = new Date(`${data.date}T00:00:00.000Z`);
  const expected = {
    amountMinor,
    createdBy: actorId,
    currency: data.currency,
    date,
    groupId,
    note: data.note || null,
    payeeId: data.payeeId,
    payerId: actorId,
  };

  try {
    return await database.$transaction(async (transaction) => {
      const group = await transaction.group.findUnique({
        where: { id: groupId },
        select: {
          defaultCurrency: true,
          members: { where: { userId: { in: [actorId, data.payeeId] } }, select: { userId: true } },
        },
      });
      if (!group) throw new SettlementError("Group not found.", "NOT_FOUND");
      const memberIds = new Set(group.members.map(({ userId }) => userId));
      if (!memberIds.has(actorId)) throw new SettlementError("You are not a member of this group.", "FORBIDDEN");
      if (!memberIds.has(data.payeeId)) {
        throw new SettlementError("Recipient must be an active group member.", "INVALID_INPUT");
      }
      if (data.payeeId === actorId) {
        throw new SettlementError("Choose another group member as the recipient.", "INVALID_INPUT");
      }
      if (data.currency !== group.defaultCurrency) {
        throw new SettlementError("Currency must match the group currency.", "INVALID_INPUT");
      }

      const existing = await transaction.settlement.findUnique({
        where: { idempotencyKey: data.idempotencyKey },
        select: {
          amountMinor: true,
          createdBy: true,
          currency: true,
          date: true,
          groupId: true,
          id: true,
          note: true,
          payeeId: true,
          payerId: true,
        },
      });
      if (existing) {
        if (!matchingRetry(existing, expected)) {
          throw new SettlementError("Settlement request ID was already used.", "INVALID_INPUT");
        }
        return { groupId, settlementId: existing.id };
      }

      const settlement = await transaction.settlement.create({
        data: {
          ...expected,
          idempotencyKey: data.idempotencyKey,
          status: "PENDING",
        },
        select: { id: true },
      });
      await transaction.activityEvent.create({
        data: {
          actorId, entityId: settlement.id, entityType: "SETTLEMENT", groupId,
          metadata: { amountMinor, currency: data.currency, payeeId: data.payeeId, payerId: actorId, status: "PENDING" } as Prisma.InputJsonValue,
          type: "SETTLEMENT_CREATED",
        },
      });
      return { groupId, settlementId: settlement.id };
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;

    const existing = await database.settlement.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
      select: {
        amountMinor: true,
        createdBy: true,
        currency: true,
        date: true,
        groupId: true,
        id: true,
        note: true,
        payeeId: true,
        payerId: true,
      },
    });
    if (!existing || !matchingRetry(existing, expected)) throw error;
    return { groupId, settlementId: existing.id };
  }
}
