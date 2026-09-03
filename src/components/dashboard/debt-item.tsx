import type { Debt } from "./types";

export function DebtItem({ debt }: { debt: Debt }) {
  return (
    <li className="flex items-center justify-between gap-4 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <p className="text-body">{debt.description}</p>
      <p className={`shrink-0 text-amount ${debt.tone === "success" ? "text-success" : "text-danger"}`}>{debt.amount}</p>
    </li>
  );
}
