import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionError } from "@/components/dashboard/section-state";
import { GroupBalanceSummary } from "@/components/groups/group-balance-summary";
import { GroupExpenseSummary } from "@/components/groups/group-expense-summary";
import { GroupHeader } from "@/components/groups/group-header";
import { GroupMembers } from "@/components/groups/group-members";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getGroupDetail } from "@/lib/groups/details";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

export default async function GroupDetailPage({ params }: GroupDetailPageProps) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?redirectTo=/groups/${groupId}`);

  const { data: profile, error: profileError } = await ensureUserProfile(supabase, user);

  if (profileError) {
    console.warn("Supabase profile setup failed on group detail page", {
      code: profileError.code,
      message: profileError.message,
    });
  }

  const groupDetail = await getGroupDetail(supabase, groupId, user.id);

  if (groupDetail.error && groupDetail.error.message === "Group not found.") {
    notFound();
  }

  if (groupDetail.error) {
    console.warn("Supabase group detail failed to load", {
      message: groupDetail.error.message,
    });
  }

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profile?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userName={displayName}
        avatarUrl={profile?.avatar_url}
        activePath="/groups"
      />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {groupDetail.group ? (
          <>
            <GroupHeader
              canAddMembers={groupDetail.group.canAddMembers}
              description={groupDetail.group.description}
              groupId={groupDetail.group.id}
              memberCount={groupDetail.group.memberCount}
              name={groupDetail.group.name}
            />
            <div className="mt-8">
              <GroupBalanceSummary balances={groupDetail.group.balances} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <GroupMembers
                  canAddMembers={groupDetail.group.canAddMembers}
                  groupId={groupDetail.group.id}
                  members={groupDetail.group.members}
                />
              </div>
              <div className="lg:col-span-2">
                <GroupExpenseSummary expenses={groupDetail.group.recentExpenses} />
              </div>
            </div>
          </>
        ) : (
          <SectionError message="This group couldn't be loaded. Please try again later." />
        )}
      </main>
    </div>
  );
}
