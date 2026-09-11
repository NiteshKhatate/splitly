"use client";

import Link from "next/link";

import { ActionMenu, actionMenuItemClass } from "@/components/ui/action-menu";

import { AddMemberDialog } from "./add-member-dialog";

export function GroupActionsMenu({ canAddMembers, groupId }: {
  canAddMembers: boolean;
  groupId: string;
}) {
  return (
    <ActionMenu label="Group actions">
      {(closeMenu) => (
        <>
          <Link className={actionMenuItemClass} href={`/groups/${groupId}/balances`} onClick={closeMenu} role="menuitem">Balances</Link>
          <Link className={actionMenuItemClass} href={`/groups/${groupId}/expenses`} onClick={closeMenu} role="menuitem">View expenses</Link>
          <Link className={actionMenuItemClass} href={`/groups/${groupId}/expenses/new`} onClick={closeMenu} role="menuitem">Add expense</Link>
          {canAddMembers ? <AddMemberDialog groupId={groupId} onDialogClose={closeMenu} variant="menu" /> : null}
        </>
      )}
    </ActionMenu>
  );
}
