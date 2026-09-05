import { ExpenseItem } from "./expense-item";
import { EmptyState, SectionError, SectionSkeleton } from "./section-state";
import { SectionCard } from "./section-card";
import type { Expense, LoadState } from "./types";

export function RecentExpenses({ expenses, state = "ready" }: { expenses: Expense[]; state?: LoadState }) {
  return (
    <section aria-labelledby="recent-expenses-heading" id="recent-expenses">
      <SectionCard id="recent-expenses-heading" title="Recent activity">
        {state === "loading" ? <SectionSkeleton rows={4} /> : state === "error" ? <SectionError /> : expenses.length === 0 ? <EmptyState message="No expense activity yet." /> : <ul>{expenses.map((expense) => <ExpenseItem expense={expense} key={expense.id} />)}</ul>}
      </SectionCard>
    </section>
  );
}
