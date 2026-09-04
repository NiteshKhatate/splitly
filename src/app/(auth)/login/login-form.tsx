"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type LoginFormData,
  loginFormSchema,
} from "@/lib/validations/auth";
import { zodResolver } from "@/lib/validations/zod-resolver";

type LoginFormProps = { redirectTo: string; initialMessage?: string };

export function LoginForm({ redirectTo, initialMessage }: LoginFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [error, setError] = useState<string>();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(loginFormSchema),
  });

  async function handleLoginSubmit(values: LoginFormData) {
    setError(undefined);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(values);

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
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleLoginSubmit)} noValidate>
      {initialMessage ? <FormMessage tone="error">{initialMessage}</FormMessage> : null}
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <TextField id="login-email" label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} required {...register("email")} />
      <TextField id="login-password" label="Password" type="password" autoComplete="current-password" error={errors.password?.message} required {...register("password")} />
      <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Logging in..." : "Log in"}</Button>
      <p className="text-center text-secondary text-foreground-muted">Need an account? <Link href="/signup" className="text-label text-primary hover:text-primary-hover">Create one</Link></p>
    </form>
  );
}
