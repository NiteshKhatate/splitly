"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { showToast } from "@/components/ui/toast";

export function ReceiptDeleteButton({ attachmentId, expenseId }: { attachmentId: string; expenseId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string>();
  async function remove() {
    setDeleting(true);
    setMessage(undefined);
    const response = await fetch(`/expenses/${expenseId}/receipts/${attachmentId}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) {
      showToast({ message: "Receipt deleted.", tone: "success" });
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
  return (
    <div className="w-full sm:w-auto">
      {message ? <div className="mb-3"><FormMessage tone="error">{message}</FormMessage></div> : null}
      <Button aria-label="Delete receipt" className="w-full sm:w-auto" disabled={deleting} onClick={remove} type="button" variant="secondary">{deleting ? "Deleting..." : "Delete"}</Button>
    </div>
  );
}
