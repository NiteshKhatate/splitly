import type { PrismaClient } from "@prisma/client";

import type { BalanceTone } from "./types";
import { parseAmountToMinorUnits } from "./group-balances";

export type DashboardBalanceSummary = {
  currency: string;
  net: { amount: string; description: string; tone: BalanceTone };
  youAreOwed: { amount: string; tone: BalanceTone };
  youOwe: { amount: string; tone: BalanceTone };
};

export type DashboardBalanceDatabase = Pick<PrismaClient, "expense" | "settlement">;

function formatMinor(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amountMinor / 100);
}

function balanceKey(groupId: string, currency: string): string {
  return `${currency}:${groupId}`;
}

export async function getDashboardBalanceSummaries(
  database: DashboardBalanceDatabase,
  userId: string,
): Promise<{ summaries: DashboardBalanceSummary[]; error: { message: string } | null }> {
  try {
    const [expenses, settlements] = await Promise.all([
      database.expense.findMany({
        where: {
          deletedAt: null,
          OR: [
            { payments: { some: { payerId: userId } } },
            { shares: { some: { participantId: userId } } },
          ],
        },
        select: {
          currency: true,
          groupId: true,
          payments: { where: { payerId: userId }, select: { amountMinor: true } },
          shares: { where: { participantId: userId }, select: { owedMinor: true } },
        },
      }),
      database.settlement.findMany({
        where: { OR: [{ payerId: userId }, { payeeId: userId }] },
        select: {
          amount: true,
          group: { select: { defaultCurrency: true } },
          groupId: true,
          payeeId: true,
          payerId: true,
        },
      }),
    ]);

    const groupBalances = new Map<string, { currency: string; netMinor: number }>();

    for (const expense of expenses) {
      const key = balanceKey(expense.groupId, expense.currency);
      const paidMinor = expense.payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
      const owedMinor = expense.shares.reduce((sum, share) => sum + share.owedMinor, 0);
      const current = groupBalances.get(key)?.netMinor ?? 0;
      groupBalances.set(key, { currency: expense.currency, netMinor: current + paidMinor - owedMinor });
    }

    for (const settlement of settlements) {
      const currency = settlement.group.defaultCurrency;
      const key = balanceKey(settlement.groupId, currency);
      const amountMinor = parseAmountToMinorUnits(settlement.amount.toString());
      const adjustment = settlement.payerId === userId ? amountMinor : -amountMinor;
      const current = groupBalances.get(key)?.netMinor ?? 0;
      groupBalances.set(key, { currency, netMinor: current + adjustment });
    }

    const totals = new Map<string, { youAreOwedMinor: number; youOweMinor: number }>();
    for (const { currency, netMinor } of groupBalances.values()) {
      const current = totals.get(currency) ?? { youAreOwedMinor: 0, youOweMinor: 0 };
      if (netMinor > 0) current.youAreOwedMinor += netMinor;
      if (netMinor < 0) current.youOweMinor += Math.abs(netMinor);
      totals.set(currency, current);
    }

    if (totals.size === 0) {
      totals.set("INR", { youAreOwedMinor: 0, youOweMinor: 0 });
    }

    return {
      summaries: Array.from(totals.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currency, amounts]) => {
          const netMinor = amounts.youAreOwedMinor - amounts.youOweMinor;
          const netTone: BalanceTone = netMinor > 0 ? "success" : netMinor < 0 ? "danger" : "neutral";
          return {
            currency,
            net: {
              amount: `${netMinor > 0 ? "+" : netMinor < 0 ? "-" : ""}${formatMinor(Math.abs(netMinor), currency)}`,
              description: netMinor > 0
                ? "Overall, you're owed money"
                : netMinor < 0
                  ? "Overall, you owe money"
                  : "You're settled up",
              tone: netTone,
            },
            youAreOwed: {
              amount: formatMinor(amounts.youAreOwedMinor, currency),
              tone: amounts.youAreOwedMinor > 0 ? "success" : "neutral",
            },
            youOwe: {
              amount: formatMinor(amounts.youOweMinor, currency),
              tone: amounts.youOweMinor > 0 ? "danger" : "neutral",
            },
          };
        }),
      error: null,
    };
  } catch {
    return { summaries: [], error: { message: "Dashboard balances could not be loaded." } };
  }
}
