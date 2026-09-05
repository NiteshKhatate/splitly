import type { PrismaClient } from "@prisma/client";

import { calculateMemberBalances, simplifyDebts } from "./balance-engine";

export type GroupBalanceDetailDatabase = Pick<PrismaClient, "group">;

function formatMinor(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { currency, style: "currency" }).format(amountMinor / 100);
}

export async function getGroupBalanceDetail(
  database: GroupBalanceDetailDatabase,
  groupId: string,
  userId: string,
) {
  try {
    const group = await database.group.findFirst({
      where: { id: groupId, members: { some: { userId } } },
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
        members: { orderBy: { joinedAt: "asc" }, select: { user: { select: { id: true, name: true } } } },
        name: true,
        settlements: {
          orderBy: [{ date: "desc" }, { createdAt: "desc" }],
          select: {
            amountMinor: true, currency: true, date: true, id: true, note: true,
            payee: { select: { id: true, name: true } }, payer: { select: { id: true, name: true } },
            status: true,
          },
        },
      },
    });
    if (!group) return { detail: null, error: { message: "Group not found." } };

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
      settlements: group.settlements.filter((settlement) => settlement.status === "CONFIRMED").map((settlement) => ({
        amountMinor: settlement.amountMinor, currency: settlement.currency,
        payeeId: settlement.payee.id, payerId: settlement.payer.id,
      })),
    });

    return {
      detail: {
        currencies: balances.map((currencyBalance) => ({
          currency: currencyBalance.currency,
          members: currencyBalance.balances.map((balance) => ({
            amount: formatMinor(Math.abs(balance.netMinor), currencyBalance.currency),
            memberId: balance.memberId,
            name: names.get(balance.memberId) ?? "Member",
            netMinor: balance.netMinor,
            status: balance.netMinor > 0 ? "is owed" : balance.netMinor < 0 ? "owes" : "settled",
          })),
          transfers: simplifyDebts(currencyBalance).map((transfer) => ({
            ...transfer,
            amount: formatMinor(transfer.amountMinor, transfer.currency),
            payeeName: names.get(transfer.payeeId) ?? "Member",
            payerName: names.get(transfer.payerId) ?? "Member",
          })),
        })),
        id: group.id,
        members: group.members.map(({ user }) => user),
        name: group.name,
        settlements: group.settlements.map((settlement) => ({
          amount: formatMinor(settlement.amountMinor, settlement.currency),
          currency: settlement.currency,
          date: new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(settlement.date),
          id: settlement.id,
          note: settlement.note,
          payeeId: settlement.payee.id,
          payeeName: settlement.payee.name,
          payerName: settlement.payer.name,
          status: settlement.status,
        })),
      },
      error: null,
    };
  } catch {
    return { detail: null, error: { message: "Group balances could not be loaded." } };
  }
}
