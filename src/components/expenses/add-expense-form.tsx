"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { SelectField } from "@/components/ui/select-field";
import { Textarea } from "@/components/ui/textarea";
import { TextField } from "@/components/ui/text-field";
import { calculateSplit, type SplitCalculationInput } from "@/lib/expenses/split-calculator";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_DESCRIPTION_MAX_LENGTH,
  EXPENSE_NOTES_MAX_LENGTH,
  expenseFormSchema,
  parseDecimalToMinor,
  parsePercentageToBasisPoints,
  type ExpenseFormValues,
} from "@/lib/validations/expenses";
import { zodResolver } from "@/lib/validations/zod-resolver";

type ExpenseMember = { id: string; name: string };

function todayForInput(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", { currency, style: "currency" }).format(minor / 100);
}

function buildPreviewInput(values: ExpenseFormValues): SplitCalculationInput {
  const totalMinor = parseDecimalToMinor(values.amount);
  const included = values.participants.filter(({ included }) => included);
  if (values.splitMethod === "EQUAL") {
    return { method: "EQUAL", participantIds: included.map(({ memberId }) => memberId), totalMinor };
  }
  if (values.splitMethod === "EXACT") {
    return { allocations: included.map((item) => ({ amountMinor: parseDecimalToMinor(item.exactAmount), participantId: item.memberId })), method: "EXACT", totalMinor };
  }
  if (values.splitMethod === "PERCENTAGE") {
    return { allocations: included.map((item) => ({ participantId: item.memberId, percentageBasisPoints: parsePercentageToBasisPoints(item.percentage) })), method: "PERCENTAGE", totalMinor };
  }
  return { allocations: included.map((item) => ({ participantId: item.memberId, shares: Number(item.shares) })), method: "SHARES", totalMinor };
}

export function AddExpenseForm({
  currency,
  groupId,
  members,
}: {
  currency: string;
  groupId: string;
  members: ExpenseMember[];
}) {
  const router = useRouter();
  const [serverMessage, setServerMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ExpenseFormValues>({
    defaultValues: {
      amount: "",
      category: "GENERAL",
      currency,
      date: todayForInput(),
      description: "",
      notes: "",
      participants: members.map(({ id }) => ({ exactAmount: "", included: true, memberId: id, percentage: "", shares: "1" })),
      payers: members.map(({ id }) => ({ amount: "", memberId: id })),
      splitMethod: "EQUAL",
    },
    resolver: zodResolver(expenseFormSchema),
  });
  const values = useWatch({ control: form.control });
  const completeValues = values as ExpenseFormValues;
  const preview = useMemo(() => {
    try {
      const allocations = calculateSplit(buildPreviewInput(completeValues));
      return allocations.map((allocation) => ({
        ...allocation,
        name: members.find(({ id }) => id === allocation.participantId)?.name ?? "Member",
      }));
    } catch {
      return [];
    }
  }, [completeValues, members]);

  async function submit(valuesToSubmit: ExpenseFormValues) {
    setIsSubmitting(true);
    setServerMessage(undefined);
    try {
      const response = await fetch(`/groups/${groupId}/expenses/create`, {
        body: JSON.stringify(valuesToSubmit),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json() as { message?: string };
      if (!response.ok) {
        setServerMessage(result.message ?? "We couldn't save that expense. Please try again.");
        return;
      }
      router.push(`/groups/${groupId}`);
      router.refresh();
    } catch {
      setServerMessage("We couldn't save that expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const splitMethod = completeValues.splitMethod;

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(submit)} noValidate>
      {serverMessage ? <FormMessage tone="error">{serverMessage}</FormMessage> : null}
      <TextField id="expense-description" label="Description" maxLength={EXPENSE_DESCRIPTION_MAX_LENGTH} required error={form.formState.errors.description?.message} {...form.register("description")} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="expense-amount" label="Total amount" inputMode="decimal" placeholder="0.00" required error={form.formState.errors.amount?.message} {...form.register("amount")} />
        <SelectField id="expense-currency" label="Currency" error={form.formState.errors.currency?.message} {...form.register("currency")}>
          {[currency, "INR", "USD", "EUR", "GBP"].filter((item, index, all) => all.indexOf(item) === index).map((code) => <option key={code}>{code}</option>)}
        </SelectField>
        <TextField id="expense-date" label="Date" type="date" required error={form.formState.errors.date?.message} {...form.register("date")} />
        <SelectField id="expense-category" label="Category" error={form.formState.errors.category?.message} {...form.register("category")}>
          {EXPENSE_CATEGORIES.map((category) => <option key={category} value={category}>{category.charAt(0) + category.slice(1).toLowerCase()}</option>)}
        </SelectField>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-card-heading">Who paid?</legend>
        <p className="text-secondary text-foreground-muted">Enter an amount for each payer. The amounts must match the total.</p>
        {members.map((member, index) => (
          <TextField key={member.id} id={`payer-${member.id}`} label={member.name} inputMode="decimal" placeholder="0.00" error={form.formState.errors.payers?.[index]?.amount?.message} {...form.register(`payers.${index}.amount`)} />
        ))}
        {form.formState.errors.payers?.root?.message ? <p className="text-caption text-danger">{form.formState.errors.payers.root.message}</p> : null}
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-card-heading">Split between</legend>
        <SelectField id="split-method" label="Split method" {...form.register("splitMethod")}>
          <option value="EQUAL">Equally</option><option value="EXACT">Exact amounts</option><option value="PERCENTAGE">Percentages</option><option value="SHARES">Shares</option>
        </SelectField>
        {members.map((member, index) => (
          <div key={member.id} className="rounded-control border border-border bg-surface-muted p-3">
            <label className="flex min-h-11 items-center gap-3 text-label">
              <input type="checkbox" className="size-5 accent-primary" {...form.register(`participants.${index}.included`)} />
              {member.name}
            </label>
            {completeValues.participants[index]?.included && splitMethod !== "EQUAL" ? (
              <div className="mt-3">
                <TextField
                  id={`split-${member.id}`}
                  label={splitMethod === "EXACT" ? "Amount" : splitMethod === "PERCENTAGE" ? "Percentage" : "Shares"}
                  inputMode={splitMethod === "SHARES" ? "numeric" : "decimal"}
                  placeholder={splitMethod === "PERCENTAGE" ? "0.00" : splitMethod === "SHARES" ? "1" : "0.00"}
                  error={splitMethod === "EXACT" ? form.formState.errors.participants?.[index]?.exactAmount?.message : splitMethod === "PERCENTAGE" ? form.formState.errors.participants?.[index]?.percentage?.message : form.formState.errors.participants?.[index]?.shares?.message}
                  {...form.register(`participants.${index}.${splitMethod === "EXACT" ? "exactAmount" : splitMethod === "PERCENTAGE" ? "percentage" : "shares"}`)}
                />
              </div>
            ) : null}
          </div>
        ))}
        {form.formState.errors.participants?.root?.message ? <p className="text-caption text-danger">{form.formState.errors.participants.root.message}</p> : null}
      </fieldset>

      <div aria-live="polite" className="rounded-control border border-border bg-surface-muted p-4">
        <h2 className="text-label">Split preview</h2>
        {preview.length > 0 ? (
          <ul className="mt-2 space-y-1 text-secondary">{preview.map((item) => <li key={item.participantId} className="flex justify-between gap-4"><span>{item.name}</span><span>{formatMoney(item.owedMinor, completeValues.currency)}</span></li>)}</ul>
        ) : <p className="mt-2 text-secondary text-foreground-muted">Enter valid split details to see the preview.</p>}
      </div>

      <Textarea id="expense-notes" label="Notes" maxLength={EXPENSE_NOTES_MAX_LENGTH} helperText="Optional." error={form.formState.errors.notes?.message} {...form.register("notes")} />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button href={`/groups/${groupId}`} variant="secondary" className="w-full sm:w-auto">Cancel</Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save expense"}</Button>
      </div>
    </form>
  );
}
