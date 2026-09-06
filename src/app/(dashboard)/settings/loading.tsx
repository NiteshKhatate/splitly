import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader userName="Splitly" activePath="/settings" />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8" aria-label="Loading preferences" role="status">
        <span className="sr-only">Loading preferences</span>
        <Skeleton className="h-10 w-72 max-w-full" />
        <Skeleton className="mt-3 h-5 w-64" />
        <Card className="mt-8 space-y-5"><Skeleton className="h-7 w-36" /><Skeleton className="h-48" /><Skeleton className="h-48" /><Skeleton className="h-72" /></Card>
        <Card className="mt-6 space-y-4"><Skeleton className="h-7 w-36" /><Skeleton className="h-24" /><Skeleton className="h-11 w-40" /></Card>
        <Card className="mt-6 space-y-4"><Skeleton className="h-7 w-40" /><Skeleton className="h-32" /></Card>
      </main>
    </div>
  );
}
