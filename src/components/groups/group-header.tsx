import Link from "next/link";

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
      <div className="mt-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="wrap-break-word text-page-heading">{name}</h1>
          <p className="mt-2 text-secondary text-foreground-muted">{memberLabel}</p>
          {description ? (
            <p className="mt-2 max-w-3xl text-secondary text-foreground-muted">{description}</p>
          ) : null}
        </div>
        <GroupActionsMenu canAddMembers={canAddMembers} canManage={canManage} groupId={groupId} />
      </div>
    </div>
  );
}
