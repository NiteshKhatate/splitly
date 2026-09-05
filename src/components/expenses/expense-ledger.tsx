import { EmptyState } from "@/components/dashboard/section-state";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ExpenseListItem } from "@/lib/expenses/list-expenses";
import Link from "next/link";

export function ExpenseLedger({ expenses, groupId }: { expenses: ExpenseListItem[]; groupId: string }) {
  if (expenses.length === 0) {
    return (
      <EmptyState
        action="Add expense"
        actionHref={`/groups/${groupId}/expenses/new`}
        description="New expenses and matching filtered results will appear here."
        message="No expenses found."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {expenses.map((expense) => (
        <li key={expense.id}>
          <Card className="sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="wrap-break-word text-card-heading">
                    <Link className="rounded-control hover:text-primary focus-visible:outline-2 focus-visible:outline-primary" href={`/expenses/${expense.id}`}>{expense.description}</Link>
                  </h2>
                  <Badge>{expense.category}</Badge>
                </div>
                <p className="mt-1 text-secondary text-foreground-muted">{expense.date}</p>
              </div>
              <p className="shrink-0 text-large-amount text-foreground">{expense.amount}</p>
            </div>
            <dl className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
              <div>
                <dt className="text-caption text-foreground-muted">Paid by</dt>
                <dd className="mt-1 text-secondary text-foreground">{expense.payers.join(", ")}</dd>
              </div>
              <div>
                <dt className="text-caption text-foreground-muted">Participants</dt>
                <dd className="mt-1 text-secondary text-foreground">{expense.participants.join(", ")}</dd>
              </div>
            </dl>
          </Card>
        </li>
      ))}
    </ul>
  );
}
