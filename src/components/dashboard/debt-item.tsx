import type { Debt } from "./types";

export function DebtItem({ debt }: { debt: Debt }) {
  return (
    <li className="flex flex-col gap-2 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0 min-[360px]:flex-row min-[360px]:items-center min-[360px]:justify-between min-[360px]:gap-4">
      <p className="min-w-0 wrap-break-word text-body">{debt.description}</p>
      <p className={`wrap-break-word text-amount min-[360px]:shrink-0 min-[360px]:text-right ${debt.tone === "success" ? "text-success" : "text-danger"}`}>{debt.amount}</p>
    </li>
  );
}
