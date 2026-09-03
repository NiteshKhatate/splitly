import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupCard } from "./group-card";
import { EmptyState, SectionError, SectionSkeleton } from "./section-state";
import { SectionCard } from "./section-card";
import type { Group, LoadState } from "./types";

export function GroupSummary({ groups, state = "ready" }: { groups: Group[]; state?: LoadState }) {
  const action = <Link href="/groups" className="rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View all <span aria-hidden="true">→</span></Link>;
  return (
    <section aria-labelledby="groups-heading">
      <SectionCard id="groups-heading" title="Your Groups" action={action}>
        {state === "loading" ? (
          <SectionSkeleton />
        ) : state === "error" ? (
          <SectionError message="Your groups couldn't be loaded. Please try again later." />
        ) : groups.length === 0 ? (
          <EmptyState
            message="You don't have any groups yet."
            description="Create a group to start sharing expenses."
            actionHref="/groups"
            action="+ Create a group"
          />
        ) : (
          <div className="space-y-4">
            <ul className="-mx-3 space-y-1">
              {groups.map((group) => (
                <GroupCard group={group} key={group.id} />
              ))}
            </ul>
            <Button href="/groups" className="w-full">
              + Create a group
            </Button>
          </div>
        )}
      </SectionCard>
    </section>
  );
}
