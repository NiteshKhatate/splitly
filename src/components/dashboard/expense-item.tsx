import type { Expense } from "./types";

export function ExpenseItem({ expense }: { expense: Expense }) {
  const impactClass = expense.impactTone === "success"
    ? "text-success"
    : expense.impactTone === "danger"
      ? "text-danger"
      : "text-foreground-muted";

  return (
    <li className="flex gap-3 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-label text-primary" aria-hidden="true">₹</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-label text-foreground">{expense.description}</p>
        <p className="mt-1 text-caption text-foreground-muted">{expense.group} · {expense.date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-label">{expense.total}</p>
        <p className={`mt-1 text-caption ${impactClass}`}>{expense.impact}</p>
      </div>
    </li>
  );
}
