import Link from "next/link";
import { GroupCard } from "./group-card";
import { EmptyState, SectionError, SectionSkeleton } from "./section-state";
import { SectionCard } from "./section-card";
import type { Group, LoadState } from "./types";

export function GroupSummary({ groups, state = "ready" }: { groups: Group[]; state?: LoadState }) {
  const action = <Link href="/groups" className="rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">View all <span aria-hidden="true">→</span></Link>;
  return (
    <section aria-labelledby="groups-heading">
      <SectionCard id="groups-heading" title="Your groups" action={action}>
        {state === "loading" ? <SectionSkeleton /> : state === "error" ? <SectionError /> : groups.length === 0 ? <EmptyState message="You don't have any groups yet." action="Create a group" /> : <ul>{groups.map((group) => <GroupCard group={group} key={group.id} />)}</ul>}
      </SectionCard>
    </section>
  );
}
