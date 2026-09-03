import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { GroupCard } from "@/components/dashboard/group-card";
import { EmptyState, SectionError } from "@/components/dashboard/section-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getDashboardGroups } from "@/lib/groups/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GroupsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/groups");

  const { data: profile, error: profileError } = await ensureUserProfile(supabase, user);

  if (profileError) {
    console.warn("Supabase profile setup failed on groups page", {
      code: profileError.code,
      message: profileError.message,
    });
  }

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profile?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";
  const userGroups = await getDashboardGroups(supabase, user.id, 100);

  if (userGroups.error) {
    console.warn("Supabase groups page failed to load", {
      message: userGroups.error.message,
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={displayName}
        avatarUrl={profile?.avatar_url}
        activePath="/groups"
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-page-heading">Groups</h1>
            <p className="mt-2 text-secondary text-foreground-muted">
              View the groups you belong to and their current balances.
            </p>
          </div>
          <Button href="/groups/new" className="w-full sm:w-auto">
            + Create a group
          </Button>
        </div>

        <Card className="mt-8">
          {userGroups.error ? (
            <SectionError message="Your groups couldn't be loaded. Please try again later." />
          ) : userGroups.groups.length === 0 ? (
            <EmptyState
              message="You don't have any groups yet."
              description="Create a group to start sharing expenses."
              actionHref="/groups/new"
              action="+ Create a group"
            />
          ) : (
            <ul className="-mx-3 space-y-1">
              {userGroups.groups.map((group) => (
                <GroupCard group={group} key={group.id} />
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}
