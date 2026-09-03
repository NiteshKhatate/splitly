"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type LoginFormProps = { redirectTo: string; initialMessage?: string };

export function LoginForm({ redirectTo, initialMessage }: LoginFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setError("Enter your email and password.");
      return;
    }
    setIsSubmitting(true);
    setError(undefined);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
      if (signInError || !data.user) {
        setError(signInError?.message.toLowerCase().includes("confirm") ? "Please confirm your email before logging in." : "We could not log you in with those details.");
        return;
      }
      const { error: profileError } = await ensureUserProfile(supabase, data.user);
      if (profileError) {
        console.warn("Supabase profile setup failed after login", {
          code: profileError.code,
          message: profileError.message,
        });
      }
      router.replace(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {initialMessage ? <FormMessage tone="error">{initialMessage}</FormMessage> : null}
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <TextField id="login-email" name="email" label="Email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <TextField id="login-password" name="password" label="Password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Logging in..." : "Log in"}</Button>
      <p className="text-center text-secondary text-foreground-muted">Need an account? <Link href="/signup" className="text-label text-primary hover:text-primary-hover">Create one</Link></p>
    </form>
  );
}
