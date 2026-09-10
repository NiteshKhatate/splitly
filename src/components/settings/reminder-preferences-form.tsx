"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { showToast } from "@/components/ui/toast";
import {
  reminderPreferencesSchema,
  type ReminderPreferencesValues,
} from "@/lib/validations/reminders";
import { zodResolver } from "@/lib/validations/zod-resolver";

export function ReminderPreferencesForm({ remindersEnabled }: { remindersEnabled: boolean }) {
  const [message, setMessage] = useState<{ text: string; tone: "error" | "success" }>();
  const form = useForm<ReminderPreferencesValues>({
    defaultValues: { remindersEnabled },
    resolver: zodResolver(reminderPreferencesSchema),
  });

  async function submit(values: ReminderPreferencesValues) {
    setMessage(undefined);
    try {
      const response = await fetch("/settings/reminders", {
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) {
        const text = body.message ?? "We couldn't save your reminder preference.";
        setMessage({ text, tone: "error" });
        showToast({ message: text, tone: "error" });
        return;
      }
      form.reset(values);
      setMessage({ text: "Reminder preference saved.", tone: "success" });
      showToast({ message: "Reminder preference saved.", tone: "success" });
    } catch {
      const text = "We couldn't save your reminder preference.";
      setMessage({ text, tone: "error" });
      showToast({ message: text, tone: "error" });
    }
  }

  return (
    <form className="space-y-5" noValidate onSubmit={form.handleSubmit(submit)}>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-control border border-border p-4 focus-within:ring-2 focus-within:ring-primary-subtle">
        <input
          className="mt-0.5 size-5 shrink-0 accent-primary"
          type="checkbox"
          {...form.register("remindersEnabled")}
        />
        <span>
          <span className="block text-label text-foreground">Email balance reminders</span>
          <span className="mt-1 block text-secondary text-foreground-muted">
            Receive at most one reminder per group and currency each day when you have an outstanding balance.
          </span>
        </span>
      </label>
      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Save preference"}
      </Button>
    </form>
  );
}
