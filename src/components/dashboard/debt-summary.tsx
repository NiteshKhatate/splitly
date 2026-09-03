import { DebtItem } from "./debt-item";
import { EmptyState, SectionError, SectionSkeleton } from "./section-state";
import { SectionCard } from "./section-card";
import type { Debt, LoadState } from "./types";

export function DebtSummary({ debts, state = "ready" }: { debts: Debt[]; state?: LoadState }) {
  return (
    <section aria-labelledby="debts-heading">
      <SectionCard id="debts-heading" title="Who owes whom?">
        {state === "loading" ? <SectionSkeleton /> : state === "error" ? <SectionError /> : debts.length === 0 ? <EmptyState message="You're all settled up." /> : <ul>{debts.map((debt) => <DebtItem debt={debt} key={debt.id} />)}</ul>}
      </SectionCard>
    </section>
  );
}
