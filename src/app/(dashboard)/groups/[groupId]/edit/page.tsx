import { notFound, redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EditGroupForm } from "@/components/groups/edit-group-form";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export default async function EditGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/groups/${groupId}/edit`);

  const [profileResult, group] = await Promise.all([
    ensureUserProfile(supabase, user),
    getDb().group.findFirst({
      where: { id: groupId, members: { some: { role: "OWNER", userId: user.id } } },
      select: { description: true, id: true, name: true },
    }),
  ]);
  if (!group) notFound();

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profileResult.data?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader activePath="/groups" avatarUrl={profileResult.data?.avatar_url} userName={displayName} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="text-page-heading">Edit group</h1>
        <p className="mt-2 text-secondary text-foreground-muted">Update the details members see for this group.</p>
        <Card className="mt-6">
          <EditGroupForm description={group.description} groupId={group.id} name={group.name} />
        </Card>
      </main>
    </div>
  );
}
