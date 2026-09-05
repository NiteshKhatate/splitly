import type { Prisma, PrismaClient } from "@prisma/client";

import { parseDecimalToMinor } from "@/lib/validations/expenses";
import { settlementFormSchema } from "@/lib/validations/settlements";

export class SettlementError extends Error {
  constructor(message: string, readonly code: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND") {
    super(message);
  }
}

export async function createSettlement(
  database: Pick<PrismaClient, "$transaction">,
  groupId: string,
  actorId: string,
  input: unknown,
) {
  const parsed = settlementFormSchema.safeParse(input);
  if (!parsed.success) throw new SettlementError("The settlement details are invalid.", "INVALID_INPUT");
  const data = parsed.data;
  const amountMinor = parseDecimalToMinor(data.amount);

  return database.$transaction(async (transaction) => {
    const group = await transaction.group.findUnique({
      where: { id: groupId },
      select: {
        defaultCurrency: true,
        expenses: { where: { currency: data.currency, deletedAt: null }, select: { id: true }, take: 1 },
        members: { where: { userId: { in: [actorId, data.payerId, data.payeeId] } }, select: { userId: true } },
      },
    });
    if (!group) throw new SettlementError("Group not found.", "NOT_FOUND");
    const memberIds = new Set(group.members.map(({ userId }) => userId));
    if (!memberIds.has(actorId)) throw new SettlementError("You are not a member of this group.", "FORBIDDEN");
    if (!memberIds.has(data.payerId) || !memberIds.has(data.payeeId)) {
      throw new SettlementError("Payer and recipient must be active group members.", "INVALID_INPUT");
    }
    if (data.currency !== group.defaultCurrency && group.expenses.length === 0) {
      throw new SettlementError("Currency must match this group's financial activity.", "INVALID_INPUT");
    }

    const settlement = await transaction.settlement.create({
      data: {
        amountMinor, createdBy: actorId, currency: data.currency,
        date: new Date(`${data.date}T00:00:00.000Z`), groupId,
        note: data.note || null, payeeId: data.payeeId, payerId: data.payerId,
      },
      select: { id: true },
    });
    await transaction.activityEvent.create({
      data: {
        actorId, entityId: settlement.id, entityType: "SETTLEMENT", groupId,
        metadata: { amountMinor, currency: data.currency, payeeId: data.payeeId, payerId: data.payerId } as Prisma.InputJsonValue,
        type: "SETTLEMENT_CREATED",
      },
    });
    return { groupId, settlementId: settlement.id };
  });
}
