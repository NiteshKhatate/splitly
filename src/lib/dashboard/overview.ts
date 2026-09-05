import type { PrismaClient } from "@prisma/client";

import type { Debt, Expense } from "@/components/dashboard/types";
import { calculateMemberBalances, simplifyDebts } from "@/lib/balances/balance-engine";

const RECENT_EXPENSE_LIMIT = 4;

export type DashboardOverviewDatabase = Pick<PrismaClient, "expense" | "group" | "settlement">;

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
): Promise<{ debts: Debt[]; expenses: Expense[]; error: { message: string } | null }> {
  try {
    const [recentExpenses, recentSettlements, groups] = await Promise.all([
      database.expense.findMany({
        where: { deletedAt: null, group: { members: { some: { userId } } } },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: RECENT_EXPENSE_LIMIT,
        select: {
          currency: true,
          createdAt: true,
          date: true,
          description: true,
          group: { select: { name: true } },
          id: true,
          payments: { where: { payerId: userId }, select: { amountMinor: true } },
          shares: { where: { participantId: userId }, select: { owedMinor: true } },
          totalMinor: true,
        },
      }),
      database.settlement.findMany({
        where: { group: { members: { some: { userId } } } },
        orderBy: [{ createdAt: "desc" }],
        take: RECENT_EXPENSE_LIMIT,
        select: {
          amountMinor: true,
          createdAt: true,
          currency: true,
          date: true,
          group: { select: { name: true } },
          id: true,
          payee: { select: { id: true, name: true } },
          payer: { select: { id: true, name: true } },
        },
      }),
      database.group.findMany({
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
            select: { amountMinor: true, currency: true, payeeId: true, payerId: true },
          },
        },
      }),
    ]);

    const expenseActivity = recentExpenses.map((expense) => {
      const paidMinor = expense.payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
      const owedMinor = expense.shares.reduce((sum, share) => sum + share.owedMinor, 0);
      const impactMinor = paidMinor - owedMinor;
      return { activityCreatedAt: expense.createdAt, item: {
        date: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(expense.date),
        description: expense.description,
        group: expense.group.name,
        id: expense.id,
        impact: impactMinor > 0
          ? `you lent ${formatMinor(impactMinor, expense.currency)}`
          : impactMinor < 0
            ? `you owe ${formatMinor(Math.abs(impactMinor), expense.currency)}`
            : "no balance change",
        impactTone: impactMinor > 0 ? "success" as const : impactMinor < 0 ? "danger" as const : "neutral" as const,
        total: formatMinor(expense.totalMinor, expense.currency),
      } };
    });
    const settlementActivity = recentSettlements.map((settlement) => {
      const isPayer = settlement.payer.id === userId;
      const isPayee = settlement.payee.id === userId;
      return { activityCreatedAt: settlement.createdAt, item: {
        date: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(settlement.date),
        description: `${settlement.payer.name} paid ${settlement.payee.name}`,
        group: settlement.group.name,
        id: `settlement:${settlement.id}`,
        impact: isPayer
          ? `you paid ${formatMinor(settlement.amountMinor, settlement.currency)}`
          : isPayee
            ? `you received ${formatMinor(settlement.amountMinor, settlement.currency)}`
            : "group settlement",
        impactTone: isPayee ? "success" as const : isPayer ? "danger" as const : "neutral" as const,
        total: formatMinor(settlement.amountMinor, settlement.currency),
      } };
    });
    const expenses = [...expenseActivity, ...settlementActivity]
      .sort((left, right) => right.activityCreatedAt.getTime() - left.activityCreatedAt.getTime())
      .slice(0, RECENT_EXPENSE_LIMIT)
      .map(({ item }) => item);

    const debts = groups.flatMap((group) => {
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

    return { debts, expenses, error: null };
  } catch {
    return { debts: [], expenses: [], error: { message: "Dashboard activity could not be loaded." } };
  }
}
