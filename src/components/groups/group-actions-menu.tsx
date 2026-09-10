"use client";

import { DotsThreeVerticalIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { Button } from "@/components/ui/button";

import { AddMemberDialog } from "./add-member-dialog";
import { DeleteGroupButton } from "./delete-group-button";

const menuItemClass = "flex min-h-11 w-full items-center rounded-control px-3 py-2 text-left text-label text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary";

export function GroupActionsMenu({
  canAddMembers,
  canManage,
  groupId,
}: {
  canAddMembers: boolean;
  canManage: boolean;
  groupId: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      containerRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (containerRef.current?.querySelector('[role="dialog"]')) return;
      if (event.key === "Escape") {
        setIsOpen(false);
        containerRef.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!["ArrowDown", "ArrowUp", "End", "Home"].includes(event.key)) return;
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'),
    );
    if (items.length === 0) return;

    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Home") items[0]?.focus();
    else if (event.key === "End") items.at(-1)?.focus();
    else if (event.key === "ArrowDown") items[(currentIndex + 1) % items.length]?.focus();
    else items[(currentIndex - 1 + items.length) % items.length]?.focus();
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <Button
        aria-controls="group-actions-menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
        variant="secondary"
      >
        <DotsThreeVerticalIcon aria-hidden="true" className="mr-2" size={20} weight="bold" />
        Group actions
      </Button>
      {isOpen ? (
        <div
          aria-label="Group actions"
          className="absolute right-0 z-40 mt-2 w-56 rounded-card border border-border bg-surface p-2 shadow-lg"
          id="group-actions-menu"
          onKeyDown={handleMenuKeyDown}
          role="menu"
        >
          <Link className={menuItemClass} href={`/groups/${groupId}/balances`} onClick={closeMenu} role="menuitem">Balances</Link>
          <Link className={menuItemClass} href={`/groups/${groupId}/expenses`} onClick={closeMenu} role="menuitem">View expenses</Link>
          <Link className={menuItemClass} href={`/groups/${groupId}/expenses/new`} onClick={closeMenu} role="menuitem">Add expense</Link>
          {canManage ? (
            <Link className={menuItemClass} href={`/groups/${groupId}/edit`} onClick={closeMenu} role="menuitem">Edit group</Link>
          ) : null}
          {canAddMembers ? (
            <AddMemberDialog
              groupId={groupId}
              onDialogClose={closeMenu}
              variant="menu"
            />
          ) : null}
          {canManage ? <DeleteGroupButton groupId={groupId} variant="menu" /> : null}
        </div>
      ) : null}
    </div>
  );
}
