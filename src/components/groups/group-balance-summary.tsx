import { BalanceCard } from "@/components/dashboard/balance-card";
import type { GroupDetail } from "@/lib/groups/details";

export function GroupBalanceSummary({ balances }: { balances: GroupDetail["balances"] }) {
  return (
    <section aria-labelledby="group-balance-heading">
      <h2 id="group-balance-heading" className="sr-only">Group balance</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <BalanceCard label="You owe" amount={balances.youOwe.amount} tone={balances.youOwe.tone} description="In this group" />
        <BalanceCard label="You're owed" amount={balances.youAreOwed.amount} tone={balances.youAreOwed.tone} description="In this group" />
        <BalanceCard label="Net balance" amount={balances.net.amount} tone={balances.net.tone} description={balances.net.description} />
      </div>
    </section>
  );
}
