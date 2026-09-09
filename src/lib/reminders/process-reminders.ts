import type { PrismaClient } from "@prisma/client";

import { calculateMemberBalances } from "@/lib/balances/balance-engine";

export type ReminderDatabase = Pick<PrismaClient, "group" | "reminderDelivery">;

export type ReminderMessage = {
  amountMinor: number;
  currency: string;
  email: string;
  groupName: string;
};

export type ReminderSender = (message: ReminderMessage) => Promise<{ providerId: string }>;

function isUniqueConflict(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "P2002");
}

function failureCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code.slice(0, 80);
  }
  return "DELIVERY_FAILED";
}

export async function processBalanceReminders(
  database: ReminderDatabase,
  send: ReminderSender,
  now = new Date(),
): Promise<{ attempted: number; failed: number; sent: number; skipped: number }> {
  const groups = await database.group.findMany({
    select: {
      defaultCurrency: true,
      expenses: {
        select: {
          currency: true,
          payments: { select: { amountMinor: true, payerId: true } },
          shares: { select: { owedMinor: true, participantId: true } },
          totalMinor: true,
        },
        where: { deletedAt: null },
      },
      id: true,
      members: {
        select: {
          user: { select: { email: true, id: true, remindersEnabled: true } },
        },
      },
      name: true,
      settlements: {
        select: { amountMinor: true, currency: true, payeeId: true, payerId: true },
        where: { status: "CONFIRMED" },
      },
    },
    where: { members: { some: { user: { remindersEnabled: true } } } },
  });

  const day = now.toISOString().slice(0, 10);
  const result = { attempted: 0, failed: 0, sent: 0, skipped: 0 };

  for (const group of groups) {
    if (
      group.expenses.some((expense) => expense.currency !== group.defaultCurrency)
      || group.settlements.some((settlement) => settlement.currency !== group.defaultCurrency)
    ) {
      throw new Error("Group financial data has inconsistent currencies.");
    }

    const members = group.members.map(({ user }) => user);
    const balances = calculateMemberBalances({
      currencies: [group.defaultCurrency],
      expenses: group.expenses.map((expense) => ({
        currency: expense.currency,
        payments: expense.payments.map((payment) => ({ amountMinor: payment.amountMinor, memberId: payment.payerId })),
        shares: expense.shares.map((share) => ({ amountMinor: share.owedMinor, memberId: share.participantId })),
        totalMinor: expense.totalMinor,
      })),
      memberIds: members.map(({ id }) => id),
      settlements: group.settlements.map((settlement) => ({
        amountMinor: settlement.amountMinor,
        currency: settlement.currency,
        payeeId: settlement.payeeId,
        payerId: settlement.payerId,
      })),
    });

    for (const currencyBalance of balances) {
      for (const balance of currencyBalance.balances) {
        if (balance.netMinor >= 0) continue;
        const recipient = members.find(({ id }) => id === balance.memberId);
        if (!recipient?.remindersEnabled || !recipient.email) continue;

        const amountMinor = Math.abs(balance.netMinor);
        const dedupeKey = `${day}:${group.id}:${recipient.id}:${currencyBalance.currency}`;
        result.attempted += 1;
        let delivery: { id: string };
        try {
          delivery = await database.reminderDelivery.create({
            data: {
              amountMinor,
              currency: currencyBalance.currency,
              dedupeKey,
              groupId: group.id,
              recipientId: recipient.id,
            },
            select: { id: true },
          });
        } catch (error) {
          if (isUniqueConflict(error)) {
            result.skipped += 1;
            continue;
          }
          throw error;
        }

        try {
          const sent = await send({
            amountMinor,
            currency: currencyBalance.currency,
            email: recipient.email,
            groupName: group.name,
          });
          await database.reminderDelivery.update({
            data: { providerId: sent.providerId, sentAt: now, status: "SENT" },
            where: { id: delivery.id },
          });
          result.sent += 1;
        } catch (error) {
          await database.reminderDelivery.update({
            data: { failureCode: failureCode(error), status: "FAILED" },
            where: { id: delivery.id },
          });
          result.failed += 1;
        }
      }
    }
  }

  return result;
}
