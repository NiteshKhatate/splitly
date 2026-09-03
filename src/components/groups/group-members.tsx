import { EmptyState } from "@/components/dashboard/section-state";
import { Card } from "@/components/ui/card";
import type { GroupMember } from "@/lib/groups/details";

import { AddMemberDialog } from "./add-member-dialog";
import { GroupMemberItem } from "./group-member-item";

export function GroupMembers({
  canAddMembers,
  groupId,
  members,
}: {
  canAddMembers: boolean;
  groupId: string;
  members: GroupMember[];
}) {
  return (
    <section aria-labelledby="group-members-heading">
      <Card>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 id="group-members-heading" className="text-card-heading">
            Members ({members.length})
          </h2>
          {canAddMembers ? <AddMemberDialog groupId={groupId} variant="link" /> : null}
        </div>
        {members.length === 0 ? (
          <EmptyState message="No members yet." />
        ) : (
          <ul>
            {members.map((member) => (
              <GroupMemberItem member={member} key={member.id} />
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
