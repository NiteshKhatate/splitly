import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AddExpenseForm } from "@/components/expenses/add-expense-form";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/groups/${groupId}/expenses/new`);

  const profileResult = await ensureUserProfile(supabase, user);
  const group = await getDb().group.findFirst({
    where: { id: groupId, members: { some: { userId: user.id } } },
    select: {
      defaultCurrency: true,
      id: true,
      members: {
        orderBy: { joinedAt: "asc" },
        select: { user: { select: { id: true, name: true } } },
      },
      name: true,
    },
  });
  if (!group) notFound();

  const metadataName = typeof user.user_metadata?.full_name === "string"
    ? user.user_metadata.full_name.trim()
    : "";
  const displayName = profileResult.data?.full_name?.trim()
    || metadataName
    || user.email?.split("@")[0]
    || "there";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={displayName} avatarUrl={profileResult.data?.avatar_url} activePath="/groups" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="text-page-heading">Add an expense</h1>
        <p className="mt-2 text-secondary text-foreground-muted">Record a shared cost in {group.name}.</p>
        <Card className="mt-6">
          <AddExpenseForm
            currency={group.defaultCurrency}
            groupId={group.id}
            members={group.members.map(({ user: member }) => member)}
          />
        </Card>
      </main>
    </div>
  );
}
