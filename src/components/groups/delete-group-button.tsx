"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { showToast } from "@/components/ui/toast";

export function DeleteGroupButton({
  groupId,
  onDialogClose,
  variant = "button",
}: {
  groupId: string;
  onDialogClose?: () => void;
  variant?: "button" | "menu";
}) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    setIsDialogOpen(false);
    onDialogClose?.();
    router.push("/groups");
    router.refresh();
  }

  function closeDialog() {
    if (isDeleting) return;
    setMessage(undefined);
    setIsDialogOpen(false);
    onDialogClose?.();
  }

  return (
    <div className={variant === "menu" ? "w-full" : "w-full sm:w-auto"} role={variant === "menu" ? "none" : undefined}>
      {variant === "menu" ? (
          <button
            className="flex min-h-11 w-full items-center rounded-control px-3 py-2 text-left text-label text-danger hover:bg-danger-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary"
            onClick={() => setIsDialogOpen(true)}
            role="menuitem"
            type="button"
          >
            Delete group
          </button>
        ) : (
          <Button className="w-full sm:w-auto" onClick={() => setIsDialogOpen(true)} type="button" variant="secondary">Delete group</Button>
      )}
      <ConfirmationDialog
        confirmLabel="Delete group"
        description="This permanently deletes the group and all of its data. This action cannot be undone."
        errorMessage={message}
        isPending={isDeleting}
        onCancel={closeDialog}
        onConfirm={remove}
        open={isDialogOpen}
        pendingLabel="Deleting..."
        title="Delete group?"
      />
    </div>
  );
}
