import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DeleteExpenseButton } from "@/components/expenses/delete-expense-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getExpenseDetail } from "@/lib/expenses/expense-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export default async function ExpenseDetailPage({ params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/expenses/${expenseId}`);
  const [profileResult, result] = await Promise.all([
    ensureUserProfile(supabase, user),
    getExpenseDetail(getDb(), expenseId, user.id),
  ]);
  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profileResult.data?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";
  if (result.error?.message === "Expense not found.") notFound();
  if (!result.detail) {
    return <div className="min-h-screen bg-background"><DashboardHeader userName={displayName} avatarUrl={profileResult.data?.avatar_url} activePath="/groups" /><main className="mx-auto max-w-4xl px-4 py-8 sm:px-6"><Card><p className="text-secondary text-danger" role="alert">This expense couldn&apos;t be loaded. Please try again later.</p></Card></main></div>;
  }
  const detail = result.detail;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={displayName} avatarUrl={profileResult.data?.avatar_url} activePath="/groups" />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Button href={`/groups/${detail.groupId}/expenses`} variant="secondary">Back to expenses</Button>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-page-heading">{detail.description}</h1><Badge>{detail.category}</Badge><Badge>{detail.currency}</Badge></div><p className="mt-2 text-secondary text-foreground-muted">{detail.groupName} · {detail.date}</p></div>
          <p className="text-large-amount">{detail.total}</p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card><h2 className="text-card-heading">Paid by</h2><ul className="mt-4 space-y-3">{detail.payments.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-4 text-secondary"><span>{item.name}</span><span>{item.amount}</span></li>)}</ul></Card>
          <Card><h2 className="text-card-heading">Split between</h2><p className="mt-1 text-caption text-foreground-muted">{detail.splitMethod} split</p><ul className="mt-4 space-y-3">{detail.shares.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-4 text-secondary"><span>{item.name}</span><span>{item.amount}</span></li>)}</ul></Card>
        </div>
        {detail.notes ? <Card className="mt-6"><h2 className="text-card-heading">Notes</h2><p className="mt-2 whitespace-pre-wrap text-secondary">{detail.notes}</p></Card> : null}
        <Card className="mt-6"><h2 className="text-card-heading">Activity</h2>{detail.activity.length ? <ul className="mt-4 space-y-3">{detail.activity.map((event, index) => <li key={`${event.date}-${index}`} className="text-secondary"><span className="text-label">{event.actor}</span> {event.label}<span className="block text-caption text-foreground-muted">{event.date}</span></li>)}</ul> : <p className="mt-2 text-secondary text-foreground-muted">No activity recorded.</p>}</Card>
        {detail.canManage ? <div className="mt-6 flex flex-col gap-3 sm:flex-row"><Button href={`/expenses/${expenseId}/edit`}>Edit expense</Button><DeleteExpenseButton expenseId={expenseId} groupId={detail.groupId} /></div> : null}
      </main>
    </div>
  );
}
