import Link from "next/link";

import { EmptyState } from "@/components/dashboard/section-state";
import { Badge } from "@/components/ui/badge";
import type { ActivityFeedItem } from "@/lib/activity/list-activity";

function formatActivityTime(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(value));
}

export function ActivityFeed({
  emptyDescription = "New expenses and settlements will appear here.",
  items,
}: {
  emptyDescription?: string;
  items: ActivityFeedItem[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        message="No activity yet."
        description={emptyDescription}
      />
    );
  }

  return (
    <ul aria-label="Activity history">
      {items.map((item) => (
        <li className="border-b border-border last:border-0" key={item.id}>
          <Link
            className="-mx-2 flex min-h-20 flex-col gap-2 rounded-control px-2 py-4 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-row sm:items-center sm:justify-between"
            href={item.href}
          >
            <div className="min-w-0">
              <p className="text-secondary text-foreground">{item.description}</p>
              <p className="mt-1 text-caption text-foreground-muted">
                {item.groupName} · <time dateTime={item.createdAt}>{formatActivityTime(item.createdAt)}</time>
              </p>
            </div>
            <Badge>{item.label}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}
