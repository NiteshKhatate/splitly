import Link from "next/link";
import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewGroupPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/groups/new");

  const { data: profile, error: profileError } = await ensureUserProfile(supabase, user);

  if (profileError) {
    console.warn("Supabase profile setup failed on new group page", {
      code: profileError.code,
      message: profileError.message,
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
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/groups"
          className="rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to groups
        </Link>

        <div className="mt-6">
          <h1 className="text-page-heading">Create a group</h1>
          <p className="mt-2 text-secondary text-foreground-muted">
            Start a shared space for expenses with friends, family, or roommates.
          </p>
        </div>

        <Card className="mt-8">
          <CreateGroupForm />
        </Card>
      </main>
    </div>
  );
}
