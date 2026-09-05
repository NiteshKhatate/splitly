import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionError } from "@/components/dashboard/section-state";
import { ExpenseFiltersForm } from "@/components/expenses/expense-filters";
import { ExpenseLedger } from "@/components/expenses/expense-ledger";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getGroupExpenses } from "@/lib/expenses/list-expenses";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { expenseFiltersSchema, type ExpenseFilters } from "@/lib/validations/expenses";
import { getDb } from "@/server/db";

type SearchParams = Record<string, string | string[] | undefined>;

function stringParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function GroupExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const [{ groupId }, rawSearchParams] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/groups/${groupId}/expenses`);

  const rawFilters = {
    category: stringParam(rawSearchParams.category),
    from: stringParam(rawSearchParams.from),
    memberId: stringParam(rawSearchParams.memberId),
    search: stringParam(rawSearchParams.search),
    to: stringParam(rawSearchParams.to),
  };
  const validation = expenseFiltersSchema.safeParse(rawFilters);
  const filters: ExpenseFilters = validation.success ? validation.data : {};
  const [profileResult, result] = await Promise.all([
    ensureUserProfile(supabase, user),
    getGroupExpenses(getDb(), groupId, user.id, filters),
  ]);

  if (result.error?.message === "Group not found.") notFound();

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profileResult.data?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={displayName} avatarUrl={profileResult.data?.avatar_url} activePath="/groups" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {result.group ? (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Button href={`/groups/${groupId}`} variant="secondary">Back to group</Button>
                <h1 className="mt-5 text-page-heading">{result.group.name} expenses</h1>
                <p className="mt-2 text-secondary text-foreground-muted">Search and filter the group ledger.</p>
              </div>
              <Button href={`/groups/${groupId}/expenses/new`}>+ Add expense</Button>
            </div>
            <Card className="mt-6">
              {!validation.success ? <div className="mb-4"><FormMessage tone="error">Check the filters and try again.</FormMessage></div> : null}
              <ExpenseFiltersForm filters={validation.success ? validation.data : rawFilters as ExpenseFilters} groupId={groupId} members={result.group.members} />
            </Card>
            <div className="mt-6"><ExpenseLedger expenses={result.expenses} groupId={groupId} /></div>
          </>
        ) : (
          <SectionError message="Expenses couldn't be loaded. Please try again later." />
        )}
      </main>
    </div>
  );
}
