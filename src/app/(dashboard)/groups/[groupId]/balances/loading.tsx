import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function BalanceLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/groups" />
      <main aria-label="Loading balances" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" role="status">
        <span className="sr-only">Loading balances</span>
        <Skeleton className="h-[40rem] w-full" />
      </main>
    </div>
  );
}
