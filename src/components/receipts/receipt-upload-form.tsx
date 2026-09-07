"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { receiptUploadFormSchema, type ReceiptUploadFormValues } from "@/lib/validations/receipts";
import { zodResolver } from "@/lib/validations/zod-resolver";

export function ReceiptUploadForm({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const form = useForm<ReceiptUploadFormValues>({ resolver: zodResolver(receiptUploadFormSchema) });

  async function submit(values: ReceiptUploadFormValues) {
    setMessage(undefined);
    const body = new FormData();
    body.set("receipt", values.receipt[0]);
    try {
      const response = await fetch(`/expenses/${expenseId}/receipts`, { body, method: "POST" });
      const result = await response.json() as { message?: string };
      if (!response.ok) {
        setMessage(result.message ?? "We couldn't upload that receipt.");
        return;
      }
      form.reset();
      router.refresh();
    } catch {
      setMessage("We couldn't upload that receipt.");
    }
  }

  return (
    <form className="mt-5 space-y-4" noValidate onSubmit={form.handleSubmit(submit)}>
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}
      <div>
        <label className="mb-2 block text-label text-foreground" htmlFor="receipt-file">Receipt file</label>
        <input
          accept="image/jpeg,image/png,application/pdf"
          aria-describedby={form.formState.errors.receipt ? "receipt-file-help receipt-file-error" : "receipt-file-help"}
          aria-invalid={form.formState.errors.receipt ? "true" : undefined}
          className="min-h-12 min-w-0 w-full max-w-full rounded-control border border-border bg-surface px-3 py-2 text-secondary file:mr-3 file:rounded-control file:border-0 file:bg-primary-subtle file:px-3 file:py-1 file:text-label file:text-primary focus:ring-2 focus:ring-primary-subtle"
          id="receipt-file"
          type="file"
          {...form.register("receipt")}
        />
        {form.formState.errors.receipt?.message ? <p id="receipt-file-error" className="mt-2 text-caption text-danger" role="alert">{form.formState.errors.receipt.message}</p> : null}
        <p id="receipt-file-help" className="mt-2 text-caption text-foreground-muted">JPEG, PNG, or PDF. Maximum 5 MB.</p>
      </div>
      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Uploading..." : "Upload receipt"}
      </Button>
    </form>
  );
}
