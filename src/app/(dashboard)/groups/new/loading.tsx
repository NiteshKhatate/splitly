import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewGroupLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/groups" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8" aria-label="Loading create group" role="status">
        <span className="sr-only">Loading create group</span>
        <Skeleton className="h-5 w-28" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-10 w-72 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="mt-8 h-96 rounded-card" />
      </main>
    </div>
  );
}
