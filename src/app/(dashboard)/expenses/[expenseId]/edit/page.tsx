import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";
import { Card } from "@/components/ui/card";
import { getExpenseDetail } from "@/lib/expenses/expense-detail";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export default async function EditExpensePage({ params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/expenses/${expenseId}/edit`);
  const result = await getExpenseDetail(getDb(), expenseId, user.id);
  if (!result.detail?.canManage) notFound();
  const detail = result.detail;
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "there";

  return <div className="min-h-screen bg-background"><DashboardHeader userName={displayName} activePath="/groups" /><main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10"><h1 className="text-page-heading">Edit expense</h1><p className="mt-2 text-secondary text-foreground-muted">Update {detail.description}. Existing shares are loaded as exact amounts.</p><Card className="mt-6"><AddExpenseForm currency={detail.currency} expenseId={expenseId} groupId={detail.groupId} initialValues={detail.initialValues} members={detail.members} /></Card></main></div>;
}
