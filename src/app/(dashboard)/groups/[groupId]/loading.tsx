import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/groups" />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8" aria-label="Loading group" role="status">
        <span className="sr-only">Loading group</span>
        <Skeleton className="h-5 w-28" />
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 max-w-full" />
            <Skeleton className="h-5 w-80 max-w-full" />
          </div>
          <Skeleton className="h-11 w-full sm:w-36" />
        </div>
        <Skeleton className="mt-8 h-40 rounded-card" />
      </main>
    </div>
  );
}
