import { redirect } from "next/navigation";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionError } from "@/components/dashboard/section-state";
import { AccountProfileForms } from "@/components/settings/account-profile-forms";
import { ReminderPreferencesForm } from "@/components/settings/reminder-preferences-form";
import { ExpenseExportForm } from "@/components/settings/expense-export-form";
import { Card } from "@/components/ui/card";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirectTo=/settings");

  const profileResult = await ensureUserProfile(supabase, user);
  const database = getDb();
  const [settings, groups] = await Promise.all([
    database.user.findUnique({ select: { remindersEnabled: true }, where: { id: user.id } }),
    database.group.findMany({
      orderBy: { name: "asc" }, select: { id: true, name: true },
      where: { members: { some: { userId: user.id } } },
    }),
  ]).catch((): [null, { id: string; name: string }[]] => [null, []]);
  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profileResult.data?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={displayName} avatarUrl={profileResult.data?.avatar_url} activePath="/settings" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <h1 className="text-page-heading">Profile and preferences</h1>
        <p className="mt-2 text-secondary text-foreground-muted">Manage your account details and how Splitly contacts you.</p>
        <section aria-labelledby="account-profile-heading" className="mt-6 sm:mt-8">
          <Card>
            <h2 id="account-profile-heading" className="text-card-heading">Account details</h2>
            <div className="mt-5">
              <AccountProfileForms currentEmail={user.email ?? ""} currentName={displayName} />
            </div>
          </Card>
        </section>
        <section aria-labelledby="reminder-preferences-heading" className="mt-4 sm:mt-8">
          <Card>
            <h2 id="reminder-preferences-heading" className="text-card-heading">Reminders</h2>
            <p className="mt-2 text-secondary text-foreground-muted">
              Splitly only sends reminders when a confirmed balance shows that you owe money.
            </p>
            <div className="mt-5">
              {settings ? <ReminderPreferencesForm remindersEnabled={settings.remindersEnabled} /> : (
                <SectionError message="Your preferences couldn't be loaded. Please try again later." />
              )}
            </div>
          </Card>
        </section>
        <section aria-labelledby="expense-export-heading" className="mt-4 sm:mt-6">
          <Card>
            <h2 id="expense-export-heading" className="text-card-heading">Export expenses</h2>
            <p className="mt-2 text-secondary text-foreground-muted">
              Download the authorized expense ledger for one of your groups.
            </p>
            <div className="mt-5">
              <ExpenseExportForm groups={groups} />
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
