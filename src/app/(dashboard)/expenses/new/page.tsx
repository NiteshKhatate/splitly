import { ArrowRightIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyState, SectionError } from "@/components/dashboard/section-state";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getDashboardGroups } from "@/lib/groups/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export default async function NewExpensePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/expenses/new");

  const [{ data: profile, error: profileError }, groupsResult] = await Promise.all([
    ensureUserProfile(supabase, user),
    getDashboardGroups(supabase, getDb(), user.id, 100),
  ]);

  if (profileError) {
    console.warn("Supabase profile setup failed on add expense page", {
      code: profileError.code,
      message: profileError.message,
    });
  }

  if (groupsResult.error) {
    console.warn("Expense group picker failed to load", { message: groupsResult.error.message });
  }

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profile?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={displayName} avatarUrl={profile?.avatar_url} activePath="/expenses/new" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="text-page-heading">Add an expense</h1>
        <p className="mt-2 text-secondary text-foreground-muted">
          Choose the group this expense belongs to.
        </p>

        <Card className="mt-6 sm:mt-8">
          {groupsResult.error ? (
            <SectionError message="Your groups couldn't be loaded. Please try again later." />
          ) : groupsResult.groups.length === 0 ? (
            <EmptyState
              message="Create a group before adding an expense."
              description="Expenses are shared with the members of a group."
              actionHref="/groups/new"
              action="Create a group"
            />
          ) : (
            <ul className="-mx-3 space-y-1">
              {groupsResult.groups.map((group) => (
                <li key={group.id}>
                  <Link
                    href={`${group.href}/expenses/new`}
                    className="flex min-h-16 items-center gap-3 rounded-control px-3 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-label text-primary" aria-hidden="true">
                      {group.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-label">{group.name}</span>
                    <ArrowRightIcon className="shrink-0 text-foreground-muted" size={20} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
