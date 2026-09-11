import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SectionSkeleton } from "@/components/dashboard/section-state";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActivityLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/activity" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" aria-label="Loading activity" role="status">
        <span className="sr-only">Loading activity</span>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
        <Card className="mt-8 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </Card>
        <Card className="mt-6"><SectionSkeleton rows={5} /></Card>
      </main>
    </div>
  );
}
