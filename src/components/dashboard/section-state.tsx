import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function SectionError() {
  return (
    <div className="rounded-control border border-danger bg-danger-subtle p-4 text-secondary text-danger" role="alert">
      This section couldn&apos;t be loaded. Please try again later.
    </div>
  );
}

export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-label="Loading section" role="status">
      <span className="sr-only">Loading</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="flex items-center gap-3" key={index}>
          <Skeleton className="size-10 shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: string;
}) {
  return (
    <div className="rounded-control bg-surface-muted p-5 text-center">
      <p className="text-secondary text-foreground-muted">{message}</p>
      {action ? (
        <Button type="button" variant="secondary" className="mt-4">
          {action}
        </Button>
      ) : null}
    </div>
  );
}
