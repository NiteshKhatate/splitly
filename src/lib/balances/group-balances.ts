import type { PrismaClient } from "@prisma/client";

import type { BalanceTone } from "./types";

export type GroupBalanceSummary = {
  amountInMinorUnits: number;
  currency: string;
  label: string;
  tone: BalanceTone;
};

export type GroupBalanceDatabase = Pick<PrismaClient, "expense" | "settlement">;

export function parseAmountToMinorUnits(amount: string | number): number {
  const normalized = String(amount).trim();
  const sign = normalized.startsWith("-") ? -1 : 1;
  const unsigned = normalized.replace(/^[+-]/, "");
  const [rupees = "0", paise = ""] = unsigned.split(".");
  const whole = Number.parseInt(rupees, 10);
  const fractional = Number.parseInt(paise.padEnd(2, "0").slice(0, 2) || "0", 10);

  return sign * ((Number.isNaN(whole) ? 0 : whole) * 100 + (Number.isNaN(fractional) ? 0 : fractional));
}

export function formatMinorUnits(amountInMinorUnits: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    currency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: "currency",
  }).format(amountInMinorUnits / 100);
}

function createBalanceSummary(amountInMinorUnits: number, currency: string): GroupBalanceSummary {
  if (amountInMinorUnits > 0) {
    return {
      amountInMinorUnits,
      currency,
      label: `You are owed ${formatMinorUnits(amountInMinorUnits, currency)}`,
      tone: "success",
    };
  }

  if (amountInMinorUnits < 0) {
    return {
      amountInMinorUnits,
      currency,
      label: `You owe ${formatMinorUnits(Math.abs(amountInMinorUnits), currency)}`,
      tone: "danger",
    };
  }

  return {
    amountInMinorUnits: 0,
    currency,
    label: "Settled up",
    tone: "neutral",
  };
}

export async function getCurrentUserGroupBalances(
  database: GroupBalanceDatabase,
  userId: string,
  groupCurrencies: ReadonlyMap<string, string>,
): Promise<{ balances: Map<string, GroupBalanceSummary>; error: { message: string } | null }> {
  const groupIds = Array.from(groupCurrencies.keys());
  const balanceAmounts = new Map(groupIds.map((groupId) => [groupId, 0]));

  if (groupIds.length === 0) {
    return { balances: new Map(), error: null };
  }

  try {
    const [expenses, settlements] = await Promise.all([
      database.expense.findMany({
        where: {
          deletedAt: null,
          group: { members: { some: { userId } } },
          groupId: { in: groupIds },
        },
        select: {
          currency: true,
          groupId: true,
          payments: {
            where: { payerId: userId },
            select: { amountMinor: true },
          },
          shares: {
            where: { participantId: userId },
            select: { owedMinor: true },
          },
        },
      }),
      database.settlement.findMany({
        where: {
          group: { members: { some: { userId } } },
          groupId: { in: groupIds },
          status: "CONFIRMED",
        },
        select: {
          amountMinor: true,
          currency: true,
          groupId: true,
          payeeId: true,
          payerId: true,
        },
      }),
    ]);

    for (const expense of expenses) {
      if (expense.currency !== groupCurrencies.get(expense.groupId)) {
        throw new Error("Expense currency does not match its group currency.");
      }

      const paidMinor = expense.payments.reduce(
        (total, payment) => total + payment.amountMinor,
        0,
      );
      const owedMinor = expense.shares.reduce(
        (total, share) => total + share.owedMinor,
        0,
      );

      balanceAmounts.set(
        expense.groupId,
        (balanceAmounts.get(expense.groupId) ?? 0) + paidMinor - owedMinor,
      );
    }

    for (const settlement of settlements) {
      if (settlement.currency !== groupCurrencies.get(settlement.groupId)) {
        throw new Error("Settlement currency does not match its group currency.");
      }

      const amountMinor = settlement.amountMinor;

      if (settlement.payeeId === userId) {
        balanceAmounts.set(
          settlement.groupId,
          (balanceAmounts.get(settlement.groupId) ?? 0) - amountMinor,
        );
      }

      if (settlement.payerId === userId) {
        balanceAmounts.set(
          settlement.groupId,
          (balanceAmounts.get(settlement.groupId) ?? 0) + amountMinor,
        );
      }
    }
  } catch {
    return {
      balances: new Map(),
      error: { message: "Group balances could not be loaded." },
    };
  }

  return {
    balances: new Map(
      Array.from(balanceAmounts, ([groupId, amountInMinorUnits]) => {
        const currency = groupCurrencies.get(groupId);
        if (!currency) throw new Error("Group currency is required.");
        return [groupId, createBalanceSummary(amountInMinorUnits, currency)];
      }),
    ),
    error: null,
  };
}
