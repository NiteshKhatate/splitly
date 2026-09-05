import type { Prisma, PrismaClient } from "@prisma/client";

import { SettlementError } from "./create-settlement";

export async function confirmSettlement(
  database: Pick<PrismaClient, "$transaction">,
  groupId: string,
  settlementId: string,
  actorId: string,
) {
  return database.$transaction(async (transaction) => {
    const settlement = await transaction.settlement.findFirst({
      where: { groupId, id: settlementId },
      select: { id: true, payeeId: true, status: true },
    });

    if (!settlement) throw new SettlementError("Settlement not found.", "NOT_FOUND");
    if (settlement.payeeId !== actorId) {
      throw new SettlementError("Only the recipient can confirm this settlement.", "FORBIDDEN");
    }
    if (settlement.status === "CONFIRMED") {
      return { groupId, settlementId, status: "CONFIRMED" as const };
    }

    const updated = await transaction.settlement.updateMany({
      where: { id: settlementId, payeeId: actorId, status: "PENDING" },
      data: { confirmedAt: new Date(), status: "CONFIRMED" },
    });

    if (updated.count === 1) {
      await transaction.activityEvent.create({
        data: {
          actorId,
          entityId: settlementId,
          entityType: "SETTLEMENT",
          groupId,
          metadata: { status: "CONFIRMED" } as Prisma.InputJsonValue,
          type: "SETTLEMENT_CONFIRMED",
        },
      });
    }

    return { groupId, settlementId, status: "CONFIRMED" as const };
  });
}
