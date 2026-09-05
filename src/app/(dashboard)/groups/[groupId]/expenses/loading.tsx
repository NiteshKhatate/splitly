import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupExpensesLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/groups" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8" aria-label="Loading expenses" role="status">
        <span className="sr-only">Loading expenses</span>
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="mt-6 h-52 w-full" />
        <div className="mt-6 space-y-3"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
      </main>
    </div>
  );
}
