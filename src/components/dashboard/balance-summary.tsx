import { BalanceCard } from "./balance-card";
import { SectionError } from "./section-state";
import type { DashboardBalanceSummary } from "@/lib/balances/dashboard-balances";

export function BalanceSummary({
  summaries,
  state = "ready",
}: {
  summaries: DashboardBalanceSummary[];
  state?: "error" | "ready";
}) {
  if (state === "error") {
    return <SectionError message="Your balance summary couldn't be loaded. Please try again later." />;
  }

  return (
    <section aria-labelledby="balance-summary-heading">
      <h2 id="balance-summary-heading" className="sr-only">Balance summary</h2>
      <div className="space-y-5">
        {summaries.map((summary) => (
          <div key={summary.currency}>
            {summaries.length > 1 ? <h3 className="mb-3 text-label text-foreground-muted">{summary.currency}</h3> : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <BalanceCard currency={summary.currency} label="You owe" amount={summary.youOwe.amount} tone={summary.youOwe.tone} description="Across all your groups" />
              <BalanceCard currency={summary.currency} label="You're owed" amount={summary.youAreOwed.amount} tone={summary.youAreOwed.tone} description="Across all your groups" />
              <BalanceCard currency={summary.currency} label="Net balance" amount={summary.net.amount} tone={summary.net.tone} description={summary.net.description} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
