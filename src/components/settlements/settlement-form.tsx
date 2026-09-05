"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { settlementFormSchema, SETTLEMENT_NOTE_MAX_LENGTH, type SettlementFormValues } from "@/lib/validations/settlements";
import { zodResolver } from "@/lib/validations/zod-resolver";

function today(): string {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function SettlementForm({
  currencies,
  defaults,
  groupId,
  payee,
  payer,
}: {
  currencies: string[];
  defaults?: Partial<Omit<SettlementFormValues, "payeeId">>;
  groupId: string;
  payee: { id: string; name: string };
  payer: { id: string; name: string };
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);
  const form = useForm<SettlementFormValues>({
    defaultValues: {
      amount: defaults?.amount ?? "",
      currency: defaults?.currency ?? currencies[0] ?? "INR",
      date: defaults?.date ?? today(),
      note: defaults?.note ?? "",
      payeeId: payee.id,
    },
    resolver: zodResolver(settlementFormSchema),
  });

  async function submit(values: SettlementFormValues) {
    setSaving(true);
    setMessage(undefined);
    try {
      const response = await fetch(`/groups/${groupId}/settlements/create`, {
        body: JSON.stringify(values), headers: { "Content-Type": "application/json" }, method: "POST",
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) setMessage(body.message ?? "We couldn't record that settlement.");
      else {
        form.reset({ ...values, amount: "", note: "" });
        router.replace(`/groups/${groupId}/balances`);
        router.refresh();
      }
    } catch {
      setMessage("We couldn't record that settlement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(submit)} noValidate>
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <input type="hidden" {...form.register("payeeId")} />
        <div>
          <p className="text-label">Payer</p>
          <p className="mt-2 min-h-11 rounded-control border border-border bg-surface-muted px-3 py-2.5 text-secondary">
            {payer.name} (you)
          </p>
        </div>
        <div>
          <p className="text-label">Recipient</p>
          <p className="mt-2 min-h-11 rounded-control border border-border bg-surface-muted px-3 py-2.5 text-secondary">
            {payee.name}
          </p>
        </div>
        <TextField id="settlement-amount" label="Amount" inputMode="decimal" placeholder="0.00" error={form.formState.errors.amount?.message} {...form.register("amount")} />
        <SelectField id="settlement-currency" label="Currency" error={form.formState.errors.currency?.message} {...form.register("currency")}>
          {currencies.map((currency) => <option key={currency}>{currency}</option>)}
        </SelectField>
        <TextField id="settlement-date" label="Date" type="date" error={form.formState.errors.date?.message} {...form.register("date")} />
      </div>
      <Textarea id="settlement-note" label="Note" maxLength={SETTLEMENT_NOTE_MAX_LENGTH} helperText="Optional." error={form.formState.errors.note?.message} {...form.register("note")} />
      <p className="text-caption text-foreground-muted">The recipient must confirm this payment before it changes balances.</p>
      <Button type="submit" disabled={saving}>{saving ? "Recording..." : "Record settlement"}</Button>
    </form>
  );
}
