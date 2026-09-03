export type LoadState = "ready" | "loading" | "error";

export type BalanceTone = "success" | "danger" | "neutral";

export type Expense = {
  id: string;
  description: string;
  group: string;
  date: string;
  total: string;
  impact: string;
  impactTone: Exclude<BalanceTone, "neutral">;
};

export type Group = {
  id: string;
  name: string;
  members: number;
  detail: string;
};

export type Debt = {
  id: string;
  description: string;
  amount: string;
  tone: Exclude<BalanceTone, "neutral">;
};
