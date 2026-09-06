import { redirect } from "next/navigation";

import { ActivityFeed } from "@/components/activity/activity-feed";
import { ActivityFilters } from "@/components/activity/activity-filters";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionError } from "@/components/dashboard/section-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  listActivity,
  parseActivityPage,
  parseActivityType,
} from "@/lib/activity/list-activity";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

type ActivityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function activityPageHref({ groupId, page, type }: { groupId?: string; page: number; type?: string }): string {
  const params = new URLSearchParams();
  if (groupId) params.set("groupId", groupId);
  if (type) params.set("type", type);
  params.set("page", String(page));
  return `/activity?${params.toString()}`;
}

export default async function ActivityPage({ searchParams }: ActivityPageProps) {
  const params = await searchParams;
  const groupId = firstValue(params.groupId)?.trim() || undefined;
  const type = parseActivityType(firstValue(params.type));
  const page = parseActivityPage(firstValue(params.page));
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/activity");

  const [{ data: profile, error: profileError }, activity] = await Promise.all([
    ensureUserProfile(supabase, user),
    listActivity(getDb(), user.id, { groupId, page, type }),
  ]);

  if (profileError) {
    console.warn("Supabase profile setup failed on activity page", {
      code: profileError.code,
      message: profileError.message,
    });
  }
  if (activity.error) {
    console.warn("Activity page failed to load", { message: activity.error.message });
  }

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profile?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={displayName} avatarUrl={profile?.avatar_url} activePath="/activity" />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div>
          <h1 className="text-page-heading">Activity</h1>
          <p className="mt-2 text-secondary text-foreground-muted">
            Review changes across the groups you belong to.
          </p>
        </div>

        <Card className="mt-8">
          <ActivityFilters groupId={groupId} groups={activity.groups} type={type} />
        </Card>

        <Card className="mt-6">
          {activity.error ? (
            <SectionError message="Your activity couldn't be loaded. Please try again later." />
          ) : (
            <ActivityFeed
              items={activity.items}
              emptyDescription={groupId || type
                ? "Try clearing the filters or add a new expense."
                : "New expenses and settlements from your groups will appear here."}
            />
          )}
        </Card>

        {!activity.error && (activity.page > 1 || activity.hasMore) ? (
          <nav aria-label="Activity pagination" className="mt-6 flex items-center justify-between gap-4">
            {activity.page > 1 ? (
              <Button href={activityPageHref({ groupId, page: activity.page - 1, type })} variant="secondary">Previous</Button>
            ) : <span />}
            {activity.hasMore ? (
              <Button href={activityPageHref({ groupId, page: activity.page + 1, type })} variant="secondary">Load more</Button>
            ) : null}
          </nav>
        ) : null}
      </main>
    </div>
  );
}
