import { redirect } from "next/navigation";
import { BalanceSummary } from "@/components/dashboard/balance-summary";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { DebtSummary } from "@/components/dashboard/debt-summary";
import { GroupSummary } from "@/components/dashboard/group-summary";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getDashboardBalanceSummaries } from "@/lib/balances/dashboard-balances";
import { getDashboardOverview } from "@/lib/dashboard/overview";
import { getDashboardGroups } from "@/lib/groups/dashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/dashboard");

  const { data: profile, error: profileError } = await ensureUserProfile(supabase, user);

  if (profileError) {
    console.warn("Supabase profile setup failed on dashboard", {
      code: profileError.code,
      message: profileError.message,
    });
  }

  const metadataName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : "";
  const displayName = profile?.full_name?.trim() || metadataName || user.email?.split("@")[0] || "there";

  const database = getDb();
  const [dashboardGroups, dashboardBalances, dashboardOverview] = await Promise.all([
    getDashboardGroups(supabase, database, user.id),
    getDashboardBalanceSummaries(database, user.id),
    getDashboardOverview(database, user.id),
  ]);

  if (dashboardGroups.error) {
    console.warn("Dashboard groups failed to load", {
      message: dashboardGroups.error.message,
    });
  }

  if (dashboardBalances.error) {
    console.warn("Dashboard balances failed to load", {
      message: dashboardBalances.error.message,
    });
  }

  if (dashboardOverview.error) {
    console.warn("Dashboard activity failed to load", { message: dashboardOverview.error.message });
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName={displayName} avatarUrl={profile?.avatar_url} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <DashboardWelcome userName={displayName} />
        <div className="mt-8">
          <BalanceSummary
            summaries={dashboardBalances.summaries}
            state={dashboardBalances.error ? "error" : "ready"}
          />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3"><RecentExpenses expenses={dashboardOverview.expenses} state={dashboardOverview.error ? "error" : "ready"} /></div>
          <div className="lg:col-span-2">
            <GroupSummary
              groups={dashboardGroups.groups}
              state={dashboardGroups.error ? "error" : "ready"}
            />
          </div>
        </div>
        <div className="mt-6"><DebtSummary debts={dashboardOverview.debts} state={dashboardOverview.error ? "error" : "ready"} /></div>
      </main>
    </div>
  );
}
