import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GroupDetailPageProps = {
  params: Promise<{
    groupId: string;
  }>;
};

type GroupRow = {
  id: string;
  name: string;
  description: string | null;
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

  const group = await supabase
    .from("groups")
    .select("id, name, description")
    .eq("id", groupId)
    .maybeSingle<GroupRow>();

  if (group.error) {
    console.warn("Supabase group detail failed to load", {
      message: group.error.message,
    });
    notFound();
  }

  if (!group.data) notFound();

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
        <Link
          href="/groups"
          className="rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to groups
        </Link>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-page-heading">{group.data.name}</h1>
            {group.data.description ? (
              <p className="mt-2 text-secondary text-foreground-muted">{group.data.description}</p>
            ) : null}
          </div>
          <Button type="button" className="w-full sm:w-auto" aria-describedby="group-detail-note">
            + Add Expense
          </Button>
          <span id="group-detail-note" className="sr-only">
            Group detail actions are coming soon.
          </span>
        </div>

        <Card className="mt-8">
          <h2 className="text-card-heading">Group details are coming soon</h2>
          <p className="mt-2 text-secondary text-foreground-muted">
            This route is ready for the full group-management experience without sending users to a 404.
          </p>
        </Card>
      </main>
    </div>
  );
}
