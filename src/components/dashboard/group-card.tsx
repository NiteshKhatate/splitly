import Link from "next/link";
import type { Group } from "./types";

const balanceClasses = {
  success: "bg-success-subtle text-success",
  danger: "bg-danger-subtle text-danger",
  neutral: "bg-surface-muted text-foreground-muted",
} satisfies Record<Group["balance"]["tone"], string>;

export function GroupCard({ group }: { group: Group }) {
  const memberLabel = `${group.members} ${group.members === 1 ? "member" : "members"}`;

  return (
    <li>
      <Link
        href={group.href}
        className="group flex min-h-20 items-center gap-3 rounded-control border border-transparent px-3 py-4 transition-colors hover:border-border hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-control bg-primary-subtle text-label text-primary"
          aria-hidden="true"
        >
          {group.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-label text-foreground">{group.name}</p>
          <p className="mt-1 text-caption text-foreground-muted">
            {memberLabel} · {group.balance.label}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-control px-2.5 py-1 text-caption ${balanceClasses[group.balance.tone]}`}
        >
          {group.balance.label}
        </span>
      </Link>
    </li>
  );
}
