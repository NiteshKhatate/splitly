"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { showToast } from "@/components/ui/toast";

export function DeleteGroupButton({
  groupId,
  variant = "button",
}: {
  groupId: string;
  variant?: "button" | "menu";
}) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string>();

  async function remove() {
    if (isDeleting) return;
    setIsDeleting(true);
    setMessage(undefined);

    const response = await fetch(`/groups/${groupId}/delete`, { method: "POST" }).catch(() => null);
    const result = response
      ? await response.json().catch(() => null) as { message?: string } | null
      : null;

    if (!response?.ok) {
      const errorMessage = result?.message ?? "We couldn't delete that group.";
      setMessage(errorMessage);
      showToast({ message: errorMessage, tone: "error" });
      setIsDeleting(false);
      return;
    }

    showToast({ message: "Group deleted.", tone: "success" });
    router.push("/groups");
    router.refresh();
  }

  return (
    <div className={variant === "menu" ? "w-full" : "w-full sm:w-auto"} role={variant === "menu" ? "none" : undefined}>
      {message ? <div className="mb-3"><FormMessage tone="error">{message}</FormMessage></div> : null}
      {isConfirming ? (
        <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <p className="text-secondary text-danger">Delete this group and all of its data?</p>
          <Button className="w-full sm:w-auto" disabled={isDeleting} onClick={() => setIsConfirming(false)} role={variant === "menu" ? "menuitem" : undefined} type="button" variant="secondary">Cancel</Button>
          <Button className="w-full sm:w-auto" disabled={isDeleting} onClick={remove} role={variant === "menu" ? "menuitem" : undefined} type="button">
            {isDeleting ? "Deleting..." : "Confirm delete"}
          </Button>
        </div>
      ) : (
        variant === "menu" ? (
          <button
            className="flex min-h-11 w-full items-center rounded-control px-3 py-2 text-left text-label text-danger hover:bg-danger-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            onClick={() => setIsConfirming(true)}
            role="menuitem"
            type="button"
          >
            Delete group
          </button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={() => setIsConfirming(true)} type="button" variant="secondary">Delete group</Button>
        )
      )}
    </div>
  );
}
