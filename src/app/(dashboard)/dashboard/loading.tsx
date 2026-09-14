import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/dashboard" />
      <main className="px-4 py-6 sm:px-6 sm:py-10 lg:px-8" aria-label="Loading dashboard" role="status">
        <span className="sr-only">Loading dashboard</span>
        <div className="mx-auto max-w-7xl">
          <div className="mt-8 space-y-3">
            <Skeleton className="h-9 w-72 max-w-full" />
            <Skeleton className="h-5 w-52 max-w-full" />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <Skeleton className="h-44 rounded-card" key={index} />)}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <Skeleton className="h-96 rounded-card lg:col-span-3" />
            <Skeleton className="h-96 rounded-card lg:col-span-2" />
          </div>
          <Skeleton className="mt-6 h-64 rounded-card" />
        </div>
      </main>
    </div>
  );
}
