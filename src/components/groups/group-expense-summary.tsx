import { EmptyState } from "@/components/dashboard/section-state";
import { Card } from "@/components/ui/card";
import type { GroupExpense } from "@/lib/groups/details";

export function GroupExpenseSummary({ expenses }: { expenses: GroupExpense[] }) {
  return (
    <section aria-labelledby="group-expenses-heading">
      <Card>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="group-expenses-heading" className="text-card-heading">Recent expenses</h2>
        </div>
        {expenses.length === 0 ? (
          <EmptyState
            message="No expenses yet."
            description="Expenses for this group will appear here."
          />
        ) : (
          <ul>
            {expenses.map((expense) => (
              <li className="flex items-center gap-3 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0" key={expense.id}>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-label text-primary" aria-hidden="true">₹</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-label text-foreground">{expense.description}</p>
                  <p className="mt-1 text-caption text-foreground-muted">{expense.date}</p>
                </div>
                <p className="shrink-0 text-label text-foreground">{expense.amount}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
