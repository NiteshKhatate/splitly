import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionError } from "@/components/dashboard/section-state";
import { ConfirmSettlementButton } from "@/components/settlements/confirm-settlement-button";
import { SettlementFlow, SettleUpButton } from "@/components/settlements/settlement-flow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getGroupBalanceDetail } from "@/lib/balances/group-balance-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

function decimalMinor(amountMinor: number): string {
  return `${Math.trunc(amountMinor / 100)}.${String(amountMinor % 100).padStart(2, "0")}`;
}

export default async function GroupBalancesPage({ params }: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/groups/${groupId}/balances`);
  const [profileResult, result] = await Promise.all([
    ensureUserProfile(supabase, user), getGroupBalanceDetail(getDb(), groupId, user.id),
  ]);
  if (!result.detail && result.error?.message === "Group not found.") notFound();
  if (!result.detail) {
    const displayName = profileResult.data?.full_name || user.email?.split("@")[0] || "there";
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader userName={displayName} avatarUrl={profileResult.data?.avatar_url} activePath="/groups" />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Button href={`/groups/${groupId}`} variant="secondary">Back to group</Button>
          <div className="mt-6"><SectionError message={result.error?.message} /></div>
        </main>
      </div>
    );
  }
  const detail = result.detail;
  const displayName = profileResult.data?.full_name || user.email?.split("@")[0] || "there";
  const payer = detail.members.find((member) => member.id === user.id) ?? { id: user.id, name: displayName };

  return (
    <div className="min-h-screen bg-background"><DashboardHeader userName={displayName} avatarUrl={profileResult.data?.avatar_url} activePath="/groups" /><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <Button href={`/groups/${groupId}`} variant="secondary">Back to group</Button>
      <h1 className="mt-5 text-page-heading">{detail.name} balances</h1>
      <p className="mt-2 text-secondary text-foreground-muted">Raw balances and suggested repayments are kept separate from expense history.</p>
      <SettlementFlow currencies={detail.currencies.map(({ currency }) => currency)} groupId={groupId} payer={payer}>
      <div className="mt-6 space-y-6">{detail.currencies.map((section) => <section key={section.currency}><div className="mb-3 flex items-center gap-2"><h2 className="text-section-heading">Balances</h2><Badge>{section.currency}</Badge></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{section.members.map((member) => <Card key={member.memberId}><p className="text-label">{member.name}</p><p className={`mt-2 text-amount ${member.netMinor > 0 ? "text-success" : member.netMinor < 0 ? "text-danger" : "text-foreground-muted"}`}>{member.status === "settled" ? "Settled" : `${member.status} ${member.amount}`}</p></Card>)}</div>
        <Card className="mt-4"><h3 className="text-card-heading">Suggested repayments</h3>{section.transfers.length ? <ul className="mt-4 space-y-3">{section.transfers.map((transfer) => <li key={`${transfer.currency}-${transfer.payerId}-${transfer.payeeId}`} className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"><span>{transfer.payerName} pays {transfer.payeeName} {transfer.amount}</span>{transfer.payerId === user.id ? <SettleUpButton amount={decimalMinor(transfer.amountMinor)} currency={transfer.currency} payee={{ id: transfer.payeeId, name: transfer.payeeName }} /> : null}</li>)}</ul> : <p className="mt-2 text-secondary text-foreground-muted">Everyone is settled.</p>}</Card>
      </section>)}</div>
      </SettlementFlow>
      <Card className="mt-6"><h2 className="text-card-heading">Settlement history</h2>{detail.settlements.length ? <ul className="mt-4 space-y-3">{detail.settlements.map((settlement) => <li key={settlement.id} className="border-b border-border pb-3 last:border-0"><div className="flex flex-wrap items-center gap-2"><p className="text-secondary">{settlement.payerName} paid {settlement.payeeName} <span className="text-label">{settlement.amount}</span></p><Badge tone={settlement.status === "CONFIRMED" ? "success" : "neutral"}>{settlement.status === "CONFIRMED" ? "Confirmed" : "Awaiting confirmation"}</Badge></div><p className="mt-1 text-caption text-foreground-muted">{settlement.date}{settlement.note ? ` · ${settlement.note}` : ""}</p>{settlement.status === "PENDING" && settlement.payeeId === user.id ? <ConfirmSettlementButton groupId={groupId} settlementId={settlement.id} /> : null}</li>)}</ul> : <p className="mt-2 text-secondary text-foreground-muted">No settlements recorded.</p>}</Card>
    </main></div>
  );
}
