"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

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
        setMessage(body.message ?? "We couldn't delete that expense.");
        return;
      }
      router.push(`/groups/${groupId}/expenses`);
      router.refresh();
    } catch {
      setMessage("We couldn't delete that expense.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      {message ? <div className="mb-3"><FormMessage tone="error">{message}</FormMessage></div> : null}
      {isConfirming ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-secondary text-danger">Delete this expense from balances?</p>
          <Button type="button" variant="secondary" onClick={() => setIsConfirming(false)} disabled={isDeleting}>Cancel</Button>
          <Button type="button" onClick={deleteExpense} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Confirm delete"}</Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setIsConfirming(true)}>Delete expense</Button>
      )}
    </div>
  );
}
