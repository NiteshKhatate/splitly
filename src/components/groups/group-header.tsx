import Link from "next/link";

import { Button } from "@/components/ui/button";

import { AddMemberDialog } from "./add-member-dialog";

export function GroupHeader({
  canAddMembers,
  description,
  groupId,
  memberCount,
  name,
}: {
  canAddMembers: boolean;
  description: string | null;
  groupId: string;
  memberCount: number;
  name: string;
}) {
  const memberLabel = `${memberCount} ${memberCount === 1 ? "member" : "members"}`;

  return (
    <div>
      <Link
        href="/groups"
        className="rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Back to groups
      </Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-page-heading">{name}</h1>
          <p className="mt-2 text-secondary text-foreground-muted">{memberLabel}</p>
          {description ? (
            <p className="mt-2 max-w-3xl text-secondary text-foreground-muted">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href={`/groups/${groupId}/expenses/new`} className="w-full sm:w-auto">
            + Add expense
          </Button>
          {canAddMembers ? <AddMemberDialog groupId={groupId} /> : null}
        </div>
      </div>
    </div>
  );
}
