import { BalanceCard } from "./balance-card";

export function BalanceSummary() {
  return (
    <section aria-labelledby="balance-summary-heading">
      <h2 id="balance-summary-heading" className="sr-only">Balance summary</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <BalanceCard label="You owe" amount="₹1,250" tone="danger" description="Across all your groups" />
        <BalanceCard label="You're owed" amount="₹3,450" tone="success" description="Across all your groups" />
        <BalanceCard label="Net balance" amount="+₹2,200" tone="success" description="Overall, you're owed money" />
      </div>
    </section>
  );
}
