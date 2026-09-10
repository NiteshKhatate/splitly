"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { showToast } from "@/components/ui/toast";

export function DeleteExpenseButton({
  expenseId,
  groupId,
  onDialogClose,
  variant = "button",
}: {
  expenseId: string;
  groupId: string;
  onDialogClose?: () => void;
  variant?: "button" | "menu";
}) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string>();

  async function deleteExpense() {
    if (isDeleting) return;
    setIsDeleting(true);
    setMessage(undefined);
    try {
      const response = await fetch(`/expenses/${expenseId}/delete`, { method: "POST" });
      const body = await response.json() as { message?: string };
      if (!response.ok) {
        const errorMessage = body.message ?? "We couldn't delete that expense.";
        setMessage(errorMessage);
        showToast({ message: errorMessage, tone: "error" });
        return;
      }
      showToast({ message: "Expense deleted.", tone: "success" });
      setIsDialogOpen(false);
      onDialogClose?.();
      router.push(`/groups/${groupId}/expenses`);
      router.refresh();
    } catch {
      const errorMessage = "We couldn't delete that expense.";
      setMessage(errorMessage);
      showToast({ message: errorMessage, tone: "error" });
    } finally {
      setIsDeleting(false);
    }
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
            Delete expense
          </button>
        ) : (
          <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={() => setIsDialogOpen(true)}>Delete expense</Button>
      )}
      <ConfirmationDialog
        confirmLabel="Delete expense"
        description="This removes the expense from active balances while preserving its audit history."
        errorMessage={message}
        isPending={isDeleting}
        onCancel={closeDialog}
        onConfirm={deleteExpense}
        open={isDialogOpen}
        pendingLabel="Deleting..."
        title="Delete expense?"
      />
    </div>
  );
}
