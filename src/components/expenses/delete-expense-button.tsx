"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { showToast } from "@/components/ui/toast";

export function DeleteExpenseButton({ expenseId, groupId }: { expenseId: string; groupId: string }) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string>();

  async function deleteExpense() {
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

  return (
    <div className="w-full sm:w-auto">
      {message ? <div className="mb-3"><FormMessage tone="error">{message}</FormMessage></div> : null}
      {isConfirming ? (
        <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-center">
          <p className="text-secondary text-danger">Delete this expense from balances?</p>
          <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={() => setIsConfirming(false)} disabled={isDeleting}>Cancel</Button>
          <Button className="w-full sm:w-auto" type="button" onClick={deleteExpense} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Confirm delete"}</Button>
        </div>
      ) : (
        <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={() => setIsConfirming(true)}>Delete expense</Button>
      )}
    </div>
  );
}
