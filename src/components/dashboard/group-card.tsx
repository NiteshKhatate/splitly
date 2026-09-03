import type { Group } from "./types";

export function GroupCard({ group }: { group: Group }) {
  return (
    <li className="flex items-center gap-3 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-muted text-label" aria-hidden="true">{group.name.charAt(0)}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-label">{group.name}</p>
        <p className="mt-1 text-caption text-foreground-muted">{group.members} members</p>
      </div>
      <p className="shrink-0 text-secondary text-foreground-muted">{group.detail}</p>
    </li>
  );
}
