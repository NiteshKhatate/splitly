import Link from "next/link";

import { ActivityFeed } from "@/components/activity/activity-feed";
import { SectionError, SectionSkeleton } from "@/components/dashboard/section-state";
import { SectionCard } from "@/components/dashboard/section-card";
import type { ActivityFeedItem } from "@/lib/activity/list-activity";

export function RecentActivity({
  items,
  state = "ready",
}: {
  items: ActivityFeedItem[];
  state?: "error" | "loading" | "ready";
}) {
  const action = (
    <Link
      className="inline-flex min-h-11 shrink-0 items-center rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      href="/activity"
    >
      View all <span aria-hidden="true">→</span>
    </Link>
  );

  return (
    <section aria-labelledby="recent-activity-heading" id="recent-activity">
      <SectionCard action={action} id="recent-activity-heading" title="Recent activity">
        {state === "loading" ? (
          <SectionSkeleton rows={4} />
        ) : state === "error" ? (
          <SectionError message="Your recent activity couldn't be loaded. Please try again later." />
        ) : (
          <ActivityFeed
            emptyDescription="New expenses, settlements, and group changes will appear here."
            items={items}
          />
        )}
      </SectionCard>
    </section>
  );
}
