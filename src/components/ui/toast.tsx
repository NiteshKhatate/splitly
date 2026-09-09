"use client";

import { XIcon } from "@phosphor-icons/react";
import { useEffect, type ReactNode } from "react";

type ToastProps = {
  children: ReactNode;
  onDismiss: () => void;
  tone: "error" | "success";
};

export function Toast({ children, onDismiss, tone }: ToastProps) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 5_000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <div
      aria-atomic="true"
      className={[
        "fixed inset-x-4 top-4 z-50 flex items-start gap-3 rounded-control border px-4 py-3 shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm",
        tone === "success"
          ? "border-success bg-success-subtle text-success"
          : "border-danger bg-danger-subtle text-danger",
      ].join(" ")}
      role={tone === "error" ? "alert" : "status"}
    >
      <div className="min-w-0 flex-1 wrap-break-word text-secondary">{children}</div>
      <button
        aria-label="Dismiss notification"
        className="-m-2 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-control"
        onClick={onDismiss}
        type="button"
      >
        <XIcon aria-hidden="true" size={18} />
      </button>
    </div>
  );
}
