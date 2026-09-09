import type { PrismaClient } from "@prisma/client";

import type { Debt } from "@/components/dashboard/types";
import { calculateMemberBalances, simplifyDebts } from "@/lib/balances/balance-engine";

export type DashboardOverviewDatabase = Pick<PrismaClient, "group">;

function formatMinor(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amountMinor / 100);
}

export async function getDashboardOverview(
  database: DashboardOverviewDatabase,
  userId: string,
): Promise<{ debts: Debt[]; error: { message: string } | null }> {
  try {
    const groups = await database.group.findMany({
      where: { members: { some: { userId } } },
      select: {
        defaultCurrency: true,
        expenses: {
          where: { deletedAt: null },
          select: {
            currency: true,
            payments: { select: { amountMinor: true, payerId: true } },
            shares: { select: { owedMinor: true, participantId: true } },
            totalMinor: true,
          },
        },
        id: true,
        members: { select: { user: { select: { id: true, name: true } } } },
        name: true,
        settlements: {
          where: { status: "CONFIRMED" },
          select: { amountMinor: true, currency: true, payeeId: true, payerId: true },
        },
      },
    });

    const debts = groups.flatMap((group) => {
      if (
        group.expenses.some((expense) => expense.currency !== group.defaultCurrency)
        || group.settlements.some((settlement) => settlement.currency !== group.defaultCurrency)
      ) {
        throw new Error("Group financial data has inconsistent currencies.");
      }

      const names = new Map(group.members.map(({ user }) => [user.id, user.name]));
      const balances = calculateMemberBalances({
        currencies: [group.defaultCurrency],
        expenses: group.expenses.map((expense) => ({
          currency: expense.currency,
          payments: expense.payments.map((payment) => ({ amountMinor: payment.amountMinor, memberId: payment.payerId })),
          shares: expense.shares.map((share) => ({ amountMinor: share.owedMinor, memberId: share.participantId })),
          totalMinor: expense.totalMinor,
        })),
        memberIds: group.members.map(({ user }) => user.id),
        settlements: group.settlements.map((settlement) => ({
          amountMinor: settlement.amountMinor,
          currency: settlement.currency,
          payeeId: settlement.payeeId,
          payerId: settlement.payerId,
        })),
      });

      return balances.flatMap((currencyBalance) => simplifyDebts(currencyBalance)
        .filter((transfer) => transfer.payerId === userId || transfer.payeeId === userId)
        .map((transfer) => {
          const userOwes = transfer.payerId === userId;
          const otherName = names.get(userOwes ? transfer.payeeId : transfer.payerId) ?? "A member";
          return {
            amount: formatMinor(transfer.amountMinor, transfer.currency),
            description: userOwes
              ? `You owe ${otherName} in ${group.name}`
              : `${otherName} owes you in ${group.name}`,
            id: `${group.id}:${transfer.currency}:${transfer.payerId}:${transfer.payeeId}`,
            tone: userOwes ? "danger" as const : "success" as const,
          };
        }));
    });

    return { debts, error: null };
  } catch {
    return { debts: [], error: { message: "Dashboard balances could not be loaded." } };
  }
}
