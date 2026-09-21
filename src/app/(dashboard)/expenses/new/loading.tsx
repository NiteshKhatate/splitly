import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewExpenseLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/expenses/new" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8" aria-label="Loading group picker" role="status">
        <span className="sr-only">Loading groups</span>
        <Skeleton className="h-10 w-60 max-w-full" />
        <Skeleton className="mt-3 h-5 w-80 max-w-full" />
        <Card className="mt-8 space-y-3">
          {Array.from({ length: 3 }, (_, index) => <Skeleton className="h-16" key={index} />)}
        </Card>
      </main>
    </div>
  );
}
