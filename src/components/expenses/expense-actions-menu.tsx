"use client";

import Link from "next/link";

import { ActionMenu, actionMenuItemClass } from "@/components/ui/action-menu";

import { DeleteExpenseButton } from "./delete-expense-button";

export function ExpenseActionsMenu({ description, expenseId, groupId }: {
  description: string;
  expenseId: string;
  groupId: string;
}) {
  return (
    <ActionMenu label={`Actions for ${description}`}>
      {(closeMenu) => (
        <>
          <Link className={actionMenuItemClass} href={`/expenses/${expenseId}/edit`} onClick={closeMenu} role="menuitem">
            Edit expense
          </Link>
          <DeleteExpenseButton expenseId={expenseId} groupId={groupId} onDialogClose={closeMenu} variant="menu" />
        </>
      )}
    </ActionMenu>
  );
}
