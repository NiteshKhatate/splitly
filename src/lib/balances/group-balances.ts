import type { PrismaClient } from "@prisma/client";

import type { BalanceTone } from "./types";

export type GroupBalanceSummary = {
  amountInMinorUnits: number;
  label: string;
  tone: BalanceTone;
};

export type GroupBalanceDatabase = Pick<PrismaClient, "expense" | "settlement">;

export const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

export function parseAmountToMinorUnits(amount: string | number): number {
  const normalized = String(amount).trim();
  const sign = normalized.startsWith("-") ? -1 : 1;
  const unsigned = normalized.replace(/^[+-]/, "");
  const [rupees = "0", paise = ""] = unsigned.split(".");
  const whole = Number.parseInt(rupees, 10);
  const fractional = Number.parseInt(paise.padEnd(2, "0").slice(0, 2) || "0", 10);

  return sign * ((Number.isNaN(whole) ? 0 : whole) * 100 + (Number.isNaN(fractional) ? 0 : fractional));
}

export function formatMinorUnits(amountInMinorUnits: number): string {
  return rupeeFormatter.format(amountInMinorUnits / 100);
}

function createBalanceSummary(amountInMinorUnits: number): GroupBalanceSummary {
  if (amountInMinorUnits > 0) {
    return {
      amountInMinorUnits,
      label: `You are owed ${formatMinorUnits(amountInMinorUnits)}`,
      tone: "success",
    };
  }

  if (amountInMinorUnits < 0) {
    return {
      amountInMinorUnits,
      label: `You owe ${formatMinorUnits(Math.abs(amountInMinorUnits))}`,
      tone: "danger",
    };
  }

  return {
    amountInMinorUnits: 0,
    label: "Settled up",
    tone: "neutral",
  };
}

export async function getCurrentUserGroupBalances(
  database: GroupBalanceDatabase,
  userId: string,
  groupIds: string[],
): Promise<{ balances: Map<string, GroupBalanceSummary>; error: { message: string } | null }> {
  const balanceAmounts = new Map(groupIds.map((groupId) => [groupId, 0]));

  if (groupIds.length === 0) {
    return { balances: new Map(), error: null };
  }

  try {
    const [expenses, settlements] = await Promise.all([
      database.expense.findMany({
        where: {
          deletedAt: null,
          groupId: { in: groupIds },
        },
        select: {
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
        where: { groupId: { in: groupIds } },
        select: {
          amount: true,
          groupId: true,
          payeeId: true,
          payerId: true,
        },
      }),
    ]);

    for (const expense of expenses) {
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
      const amountMinor = parseAmountToMinorUnits(settlement.amount.toString());

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
      Array.from(balanceAmounts, ([groupId, amountInMinorUnits]) => [
        groupId,
        createBalanceSummary(amountInMinorUnits),
      ]),
    ),
    error: null,
  };
}
