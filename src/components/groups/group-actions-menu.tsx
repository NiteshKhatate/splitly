"use client";

import Link from "next/link";

import { ActionMenu, actionMenuItemClass } from "@/components/ui/action-menu";

import { AddMemberDialog } from "./add-member-dialog";
import { DeleteGroupButton } from "./delete-group-button";

export function GroupActionsMenu({ canAddMembers, canManage, groupId }: {
  canAddMembers: boolean;
  canManage: boolean;
  groupId: string;
}) {
  return (
    <ActionMenu label="Group actions">
      {(closeMenu) => (
        <>
          <Link className={actionMenuItemClass} href={`/groups/${groupId}/balances`} onClick={closeMenu} role="menuitem">Balances</Link>
          <Link className={actionMenuItemClass} href={`/groups/${groupId}/expenses`} onClick={closeMenu} role="menuitem">View expenses</Link>
          <Link className={actionMenuItemClass} href={`/groups/${groupId}/expenses/new`} onClick={closeMenu} role="menuitem">Add expense</Link>
          {canManage ? <Link className={actionMenuItemClass} href={`/groups/${groupId}/edit`} onClick={closeMenu} role="menuitem">Edit group</Link> : null}
          {canAddMembers ? <AddMemberDialog groupId={groupId} onDialogClose={closeMenu} variant="menu" /> : null}
          {canManage ? <DeleteGroupButton groupId={groupId} onDialogClose={closeMenu} variant="menu" /> : null}
        </>
      )}
    </ActionMenu>
  );
}
