"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { showToast } from "@/components/ui/toast";

export function ReceiptDeleteButton({ attachmentId, expenseId }: { attachmentId: string; expenseId: string }) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string>();
  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setMessage(undefined);
    const response = await fetch(`/expenses/${expenseId}/receipts/${attachmentId}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) {
      showToast({ message: "Receipt deleted.", tone: "success" });
      setIsDialogOpen(false);
      router.refresh();
    }
    else {
      const result = response ? await response.json().catch(() => null) as { message?: string } | null : null;
      const errorMessage = result?.message ?? "We couldn't delete that receipt. Please try again.";
      setMessage(errorMessage);
      showToast({ message: errorMessage, tone: "error" });
    }
    setDeleting(false);
  }

  function closeDialog() {
    if (deleting) return;
    setMessage(undefined);
    setIsDialogOpen(false);
  }

  return (
    <div className="w-full sm:w-auto">
      <Button aria-label="Delete receipt" className="w-full sm:w-auto" onClick={() => setIsDialogOpen(true)} type="button" variant="secondary">Delete</Button>
      <ConfirmationDialog
        confirmLabel="Delete receipt"
        description="This permanently removes the receipt file. This action cannot be undone."
        errorMessage={message}
        isPending={deleting}
        onCancel={closeDialog}
        onConfirm={remove}
        open={isDialogOpen}
        pendingLabel="Deleting..."
        title="Delete receipt?"
      />
    </div>
  );
}
