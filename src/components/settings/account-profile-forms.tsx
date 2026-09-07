"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import {
  PROFILE_NAME_MAX_LENGTH,
  profileEmailFormSchema,
  type ProfileEmailFormData,
  profileNameFormSchema,
  type ProfileNameFormData,
  profilePasswordFormSchema,
  type ProfilePasswordFormData,
  SIGNUP_PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth";
import { zodResolver } from "@/lib/validations/zod-resolver";

type Message = { text: string; tone: "error" | "success" };

async function submitAccountUpdate(body: object): Promise<{ message: string; ok: boolean }> {
  try {
    const response = await fetch("/settings/account", {
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      method: "PATCH",
    });
    const result = await response.json() as { message?: string };
    return {
      message: result.message ?? (response.ok ? "Account updated." : "We couldn't update your account."),
      ok: response.ok,
    };
  } catch {
    return { message: "We couldn't update your account. Please try again.", ok: false };
  }
}

function NameForm({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<Message>();
  const form = useForm<ProfileNameFormData>({
    defaultValues: { fullName: currentName },
    resolver: zodResolver(profileNameFormSchema),
  });

  async function submit(values: ProfileNameFormData) {
    setMessage(undefined);
    const result = await submitAccountUpdate({ kind: "name", ...values });
    setMessage({ text: result.message, tone: result.ok ? "success" : "error" });
    if (result.ok) router.refresh();
  }

  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)}>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <TextField
        autoComplete="name"
        error={form.formState.errors.fullName?.message}
        id="profile-full-name"
        label="Full name"
        maxLength={PROFILE_NAME_MAX_LENGTH}
        required
        {...form.register("fullName", { onChange: () => setMessage(undefined) })}
      />
      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Saving..." : "Update name"}
      </Button>
    </form>
  );
}

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const [message, setMessage] = useState<Message>();
  const form = useForm<ProfileEmailFormData>({
    defaultValues: { email: currentEmail },
    resolver: zodResolver(profileEmailFormSchema),
  });

  async function submit(values: ProfileEmailFormData) {
    setMessage(undefined);
    const result = await submitAccountUpdate({ kind: "email", ...values });
    setMessage({ text: result.message, tone: result.ok ? "success" : "error" });
  }

  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)}>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <TextField
        autoComplete="email"
        error={form.formState.errors.email?.message}
        id="profile-email"
        inputMode="email"
        label="Email address"
        required
        type="email"
        {...form.register("email", { onChange: () => setMessage(undefined) })}
      />
      <p className="text-caption text-foreground-muted">You may need to confirm the change from your current and new inboxes.</p>
      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Requesting..." : "Update email"}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const [message, setMessage] = useState<Message>();
  const form = useForm<ProfilePasswordFormData>({
    defaultValues: { confirmPassword: "", currentPassword: "", password: "" },
    resolver: zodResolver(profilePasswordFormSchema),
  });

  async function submit(values: ProfilePasswordFormData) {
    setMessage(undefined);
    const result = await submitAccountUpdate({ kind: "password", ...values });
    setMessage({ text: result.message, tone: result.ok ? "success" : "error" });
    if (result.ok) form.reset();
  }

  return (
    <form className="space-y-4" noValidate onSubmit={form.handleSubmit(submit)}>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <TextField
        autoComplete="current-password"
        error={form.formState.errors.currentPassword?.message}
        id="profile-current-password"
        label="Current password"
        required
        type="password"
        {...form.register("currentPassword", { onChange: () => setMessage(undefined) })}
      />
      <TextField
        autoComplete="new-password"
        error={form.formState.errors.password?.message}
        helperText={`Use at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`}
        id="profile-new-password"
        label="New password"
        required
        type="password"
        {...form.register("password", { onChange: () => setMessage(undefined) })}
      />
      <TextField
        autoComplete="new-password"
        error={form.formState.errors.confirmPassword?.message}
        id="profile-confirm-password"
        label="Confirm new password"
        required
        type="password"
        {...form.register("confirmPassword", { onChange: () => setMessage(undefined) })}
      />
      <Button className="w-full sm:w-auto" disabled={form.formState.isSubmitting} type="submit">
        {form.formState.isSubmitting ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}

export function AccountProfileForms({ currentEmail, currentName }: { currentEmail: string; currentName: string }) {
  return (
    <div className="divide-y divide-border">
      <section aria-labelledby="profile-name-heading" className="pb-6">
        <h3 className="text-label" id="profile-name-heading">Name</h3>
        <p className="mb-4 mt-1 text-secondary text-foreground-muted">This is how other group members see you.</p>
        <NameForm currentName={currentName} />
      </section>
      <section aria-labelledby="profile-email-heading" className="py-6">
        <h3 className="text-label" id="profile-email-heading">Email</h3>
        <p className="mb-4 mt-1 text-secondary text-foreground-muted">Used to sign in and receive account messages.</p>
        <EmailForm currentEmail={currentEmail} />
      </section>
      <section aria-labelledby="profile-password-heading" className="pt-6">
        <h3 className="text-label" id="profile-password-heading">Password</h3>
        <p className="mb-4 mt-1 text-secondary text-foreground-muted">Choose a new password for your account.</p>
        <PasswordForm />
      </section>
    </div>
  );
}
