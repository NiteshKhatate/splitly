import Link from "next/link";
import { ExpenseItem } from "./expense-item";
import { EmptyState, SectionError, SectionSkeleton } from "./section-state";
import { SectionCard } from "./section-card";
import type { Expense, LoadState } from "./types";

export function RecentExpenses({ expenses, state = "ready" }: { expenses: Expense[]; state?: LoadState }) {
  const action = <Link href="/expenses" className="rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View all <span aria-hidden="true">→</span></Link>;
  return (
    <section aria-labelledby="recent-expenses-heading" id="recent-expenses">
      <SectionCard id="recent-expenses-heading" title="Recent expenses" action={action}>
        {state === "loading" ? <SectionSkeleton rows={4} /> : state === "error" ? <SectionError /> : expenses.length === 0 ? <EmptyState message="No expenses yet." action="Add your first expense" /> : <ul>{expenses.map((expense) => <ExpenseItem expense={expense} key={expense.id} />)}</ul>}
      </SectionCard>
    </section>
  );
}
