import type { BalanceTone } from "@/lib/balances/types";

export type LoadState = "ready" | "loading" | "error";

export type { BalanceTone };

export type Expense = {
  id: string;
  description: string;
  group: string;
  date: string;
  total: string;
  impact: string;
  impactTone: BalanceTone;
};

export type Group = {
  id: string;
  name: string;
  members: number;
  balance: {
    amountInMinorUnits: number;
    label: string;
    tone: BalanceTone;
  };
  href: string;
};

export type Debt = {
  id: string;
  description: string;
  amount: string;
  tone: Exclude<BalanceTone, "neutral">;
};
