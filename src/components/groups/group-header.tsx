import Link from "next/link";

import { Button } from "@/components/ui/button";
import { GroupActionsMenu } from "./group-actions-menu";

export function GroupHeader({
  canAddMembers,
  canManage,
  description,
  groupId,
  memberCount,
  name,
}: {
  canAddMembers: boolean;
  canManage: boolean;
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
        className="inline-flex min-h-11 items-center rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Back to groups
      </Link>
      <div className="mt-4 flex items-start justify-between gap-3 sm:mt-6 sm:gap-4">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-page-heading">{name}</h1>
          <p className="mt-2 text-secondary text-foreground-muted">{memberLabel}</p>
          {description ? (
            <p className="mt-2 max-w-3xl text-secondary text-foreground-muted">{description}</p>
          ) : null}
        </div>
        <GroupActionsMenu canAddMembers={canAddMembers} canManage={canManage} groupId={groupId} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:flex sm:flex-wrap">
        <Button href={`/groups/${groupId}/expenses/new`} className="w-full sm:w-auto">
          Add expense
        </Button>
        <Button href={`/groups/${groupId}/balances`} className="w-full sm:w-auto" variant="secondary">
          View balances
        </Button>
        <Button href={`/groups/${groupId}/expenses`} className="col-span-2 w-full sm:w-auto" variant="secondary">
          All expenses
        </Button>
      </div>
    </div>
  );
}
