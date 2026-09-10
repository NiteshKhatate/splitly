"use client";

import { ListIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

export const actionMenuItemClass = "flex min-h-11 w-full items-center rounded-control px-3 py-2 text-left text-label text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary";

export function ActionMenu({ children, label }: {
  children: (closeMenu: () => void) => ReactNode;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (isOpen) containerRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) closeMenu();
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || containerRef.current?.querySelector('[role="dialog"]')) return;
      closeMenu();
      containerRef.current?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [closeMenu, isOpen]);

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('[role="dialog"]')) return;
    if (!["ArrowDown", "ArrowUp", "End", "Home"].includes(event.key)) return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
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
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={label}
        className="min-w-11 px-3"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
        type="button"
        variant="secondary"
      >
        <ListIcon aria-hidden="true" size={20} weight="bold" />
      </Button>
      {isOpen ? (
        <div aria-label={label} className="absolute right-0 z-40 mt-2 w-56 rounded-card border border-border bg-surface p-2 shadow-lg" id={menuId} onKeyDown={handleMenuKeyDown} role="menu">
          {children(closeMenu)}
        </div>
      ) : null}
    </div>
  );
}
