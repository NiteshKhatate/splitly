import { redirect } from "next/navigation";
import { BalanceSummary } from "@/components/dashboard/balance-summary";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { DebtSummary } from "@/components/dashboard/debt-summary";
import { GroupSummary } from "@/components/dashboard/group-summary";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import type { Debt, Expense } from "@/components/dashboard/types";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { getDashboardBalanceSummaries } from "@/lib/balances/dashboard-balances";
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

  const expenses: Expense[] = [
    { id: "dinner", description: "Dinner with friends", group: "Weekend Trip", date: "30 Aug", total: "₹1,200", impact: "you lent ₹800", impactTone: "success" },
    { id: "hotel", description: "Goa hotel", group: "Goa Trip", date: "28 Aug", total: "₹4,500", impact: "you owe ₹1,500", impactTone: "danger" },
    { id: "groceries", description: "Groceries", group: "Flatmates", date: "25 Aug", total: "₹850", impact: "you lent ₹567", impactTone: "success" },
    { id: "movie", description: "Movie tickets", group: "Weekend Trip", date: "22 Aug", total: "₹600", impact: "you owe ₹300", impactTone: "danger" },
  ];
  const database = getDb();
  const [dashboardGroups, dashboardBalances] = await Promise.all([
    getDashboardGroups(supabase, database, user.id),
    getDashboardBalanceSummaries(database, user.id),
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

  const debts: Debt[] = [
    { id: "amit", description: "Amit owes you", amount: "₹1,000", tone: "success" },
    { id: "nitesh", description: "You owe Nitesh", amount: "₹500", tone: "danger" },
    { id: "priya", description: "Priya owes you", amount: "₹750", tone: "success" },
  ];

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
          <div className="lg:col-span-3"><RecentExpenses expenses={expenses} /></div>
          <div className="lg:col-span-2">
            <GroupSummary
              groups={dashboardGroups.groups}
              state={dashboardGroups.error ? "error" : "ready"}
            />
          </div>
        </div>
        <div className="mt-6"><DebtSummary debts={debts} /></div>
        <p className="mt-6 text-center text-caption text-foreground-muted">Recent expenses and debt summaries are sample data while expense tracking is being connected.</p>
      </main>
    </div>
  );
}
