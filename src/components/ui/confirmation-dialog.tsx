"use client";

import { XIcon } from "@phosphor-icons/react";
import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

type ConfirmationDialogProps = {
  confirmLabel: string;
  description: string;
  errorMessage?: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  pendingLabel: string;
  title: string;
};

export function ConfirmationDialog({
  confirmLabel,
  description,
  errorMessage,
  isPending,
  onCancel,
  onConfirm,
  open,
  pendingLabel,
  title,
}: ConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isPendingRef = useRef(isPending);
  const onCancelRef = useRef(onCancel);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    isPendingRef.current = isPending;
    onCancelRef.current = onCancel;
  }, [isPending, onCancel]);

  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = "hidden";
    dialog?.querySelector<HTMLElement>("[data-confirmation-cancel]")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!isPendingRef.current) onCancelRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      ));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 sm:items-center sm:px-4 sm:py-6">
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-t-card border border-border bg-surface p-5 shadow-lg sm:max-h-full sm:rounded-card sm:p-6"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-card-heading" id={titleId}>{title}</h2>
            <p className="mt-2 text-secondary text-foreground-muted" id={descriptionId}>{description}</p>
          </div>
          <button
            aria-label="Close confirmation dialog"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-label text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            <XIcon aria-hidden="true" size={18} weight="bold" />
          </button>
        </div>

        {errorMessage ? <div className="mt-5"><FormMessage tone="error">{errorMessage}</FormMessage></div> : null}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button data-confirmation-cancel disabled={isPending} onClick={onCancel} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onConfirm} type="button">
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
