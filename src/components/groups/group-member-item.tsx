import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { GroupMember } from "@/lib/groups/details";

export function GroupMemberItem({ member }: { member: GroupMember }) {
  const roleLabel = member.isCurrentUser ? "You" : member.role === "admin" ? "Admin" : "Member";

  return (
    <li className="flex items-center gap-3 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <Avatar name={member.name} src={member.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-label text-foreground">{member.name}</p>
        {member.email ? (
          <p className="mt-1 truncate text-caption text-foreground-muted">{member.email}</p>
        ) : null}
      </div>
      <Badge tone={member.isCurrentUser ? "success" : "neutral"}>{roleLabel}</Badge>
    </li>
  );
}
