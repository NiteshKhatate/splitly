"use client";

import { XIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type ToastTone = "error" | "success";

type ToastNotice = {
  message: string;
  tone: ToastTone;
};

const TOAST_EVENT = "splitly:toast";

export function showToast(notice: ToastNotice) {
  window.dispatchEvent(new CustomEvent<ToastNotice>(TOAST_EVENT, { detail: notice }));
}

type ToastProps = {
  children: ReactNode;
  onDismiss: () => void;
  tone: ToastTone;
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
        "fixed inset-x-4 top-20 z-50 flex items-start gap-3 rounded-control border px-4 py-3 shadow-lg sm:left-auto sm:right-6 sm:top-6 sm:w-full sm:max-w-sm",
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

export function ToastViewport() {
  const [notice, setNotice] = useState<ToastNotice>();
  const dismiss = useCallback(() => setNotice(undefined), []);

  useEffect(() => {
    function handleToast(event: Event) {
      const nextNotice = (event as CustomEvent<ToastNotice>).detail;
      setNotice((current) => (
        current?.message === nextNotice.message && current.tone === nextNotice.tone
          ? current
          : nextNotice
      ));
    }

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  return notice ? (
    <Toast onDismiss={dismiss} tone={notice.tone}>
      {notice.message}
    </Toast>
  ) : null;
}
