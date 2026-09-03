import type { SupabaseClient } from "@supabase/supabase-js";

import type { BalanceTone } from "./types";

export type GroupBalanceSummary = {
  amountInMinorUnits: number;
  label: string;
  tone: BalanceTone;
};

type ExpenseRow = {
  id: string;
  group_id: string;
  amount: string | number;
  paid_by: string;
};

type ExpenseSplitRow = {
  expense_id: string;
  amount: string | number;
};

type SettlementRow = {
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: string | number;
};

const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

function parseAmountToMinorUnits(amount: string | number): number {
  const normalized = String(amount).trim();
  const sign = normalized.startsWith("-") ? -1 : 1;
  const unsigned = normalized.replace(/^[+-]/, "");
  const [rupees = "0", paise = ""] = unsigned.split(".");
  const whole = Number.parseInt(rupees, 10);
  const fractional = Number.parseInt(paise.padEnd(2, "0").slice(0, 2) || "0", 10);

  return sign * ((Number.isNaN(whole) ? 0 : whole) * 100 + (Number.isNaN(fractional) ? 0 : fractional));
}

function formatMinorUnits(amountInMinorUnits: number): string {
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
  supabase: SupabaseClient,
  userId: string,
  groupIds: string[],
): Promise<{ balances: Map<string, GroupBalanceSummary>; error: { message: string } | null }> {
  const balanceAmounts = new Map(groupIds.map((groupId) => [groupId, 0]));

  if (groupIds.length === 0) {
    return { balances: new Map(), error: null };
  }

  const expenses = await supabase
    .from("expenses")
    .select("id, group_id, amount, paid_by")
    .in("group_id", groupIds)
    .returns<ExpenseRow[]>();

  if (expenses.error) {
    return { balances: new Map(), error: expenses.error };
  }

  const expenseIds = expenses.data.map((expense) => expense.id);
  const [splits, settlements] = await Promise.all([
    expenseIds.length > 0
      ? supabase
          .from("expense_splits")
          .select("expense_id, amount")
          .eq("user_id", userId)
          .in("expense_id", expenseIds)
          .returns<ExpenseSplitRow[]>()
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("settlements")
      .select("group_id, paid_by, paid_to, amount")
      .in("group_id", groupIds)
      .returns<SettlementRow[]>(),
  ]);

  if (splits.error) {
    return { balances: new Map(), error: splits.error };
  }

  if (settlements.error) {
    return { balances: new Map(), error: settlements.error };
  }

  const expenseGroups = new Map(expenses.data.map((expense) => [expense.id, expense.group_id]));

  for (const expense of expenses.data) {
    if (expense.paid_by === userId) {
      balanceAmounts.set(
        expense.group_id,
        (balanceAmounts.get(expense.group_id) ?? 0) + parseAmountToMinorUnits(expense.amount),
      );
    }
  }

  for (const split of splits.data) {
    const groupId = expenseGroups.get(split.expense_id);

    if (groupId) {
      balanceAmounts.set(
        groupId,
        (balanceAmounts.get(groupId) ?? 0) - parseAmountToMinorUnits(split.amount),
      );
    }
  }

  for (const settlement of settlements.data) {
    const amount = parseAmountToMinorUnits(settlement.amount);

    if (settlement.paid_to === userId) {
      balanceAmounts.set(settlement.group_id, (balanceAmounts.get(settlement.group_id) ?? 0) - amount);
    }

    if (settlement.paid_by === userId) {
      balanceAmounts.set(settlement.group_id, (balanceAmounts.get(settlement.group_id) ?? 0) + amount);
    }
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
