"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type ResetPasswordFormData,
  resetPasswordFormSchema,
  SIGNUP_PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth";
import { zodResolver } from "@/lib/validations/zod-resolver";

const RESET_PASSWORD_SESSION_TIMEOUT_MS = 12000;

function cleanAuthParameters() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

async function withResetSessionTimeout<T>(promise: Promise<T>) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new Error("Password reset session check timed out."));
        }, RESET_PASSWORD_SESSION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string>();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(resetPasswordFormSchema),
  });

  useEffect(() => {
    let isActive = true;

    async function establishRecoverySession() {
      try {
        const supabase = createSupabaseBrowserClient({
          detectSessionInUrl: false,
          isSingleton: false,
        });
        const hash = new URLSearchParams(window.location.hash.slice(1));
        const query = new URLSearchParams(window.location.search);
        const authError = query.get("error_description") ?? hash.get("error_description");
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const code = query.get("code");
        const tokenHash = query.get("token_hash");
        const otpType = query.get("type") as EmailOtpType | null;
        let activeSession: Session | null = null;

        if (authError) {
          setMessage("This password reset link is invalid or has expired.");
          cleanAuthParameters();
          return;
        }

        if (accessToken && refreshToken) {
          const result = await withResetSessionTimeout(supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          }));

          if (result.error) {
            setMessage("This password reset link is invalid or has expired.");
            return;
          }

          activeSession = result.data.session;
          cleanAuthParameters();
        } else if (code) {
          const result = await withResetSessionTimeout(supabase.auth.exchangeCodeForSession(code));

          if (result.error) {
            setMessage("This password reset link is invalid or has expired.");
            return;
          }

          activeSession = result.data.session;
          cleanAuthParameters();
        } else if (tokenHash && otpType) {
          const result = await withResetSessionTimeout(supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          }));

          if (result.error) {
            setMessage("This password reset link is invalid or has expired.");
            return;
          }

          activeSession = result.data.session;
          cleanAuthParameters();
        } else {
          const result = await withResetSessionTimeout(supabase.auth.getSession());
          activeSession = result.data.session;
        }

        if (!isActive) return;

        if (!activeSession) {
          setMessage("Open the password reset link from your email to continue.");
          return;
        }

        setSession(activeSession);
      } catch (error) {
        console.warn("Password reset session check failed", {
          message: error instanceof Error ? error.message : String(error),
        });

        if (isActive) {
          setMessage("We couldn't check this reset link. Open it again or request a new one.");
        }
      } finally {
        if (isActive) {
          setIsCheckingSession(false);
        }
      }
    }

    void establishRecoverySession();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleResetPasswordSubmit(values: ResetPasswordFormData) {
    if (!session) return;

    setMessage(undefined);

    try {
      const supabase = createSupabaseBrowserClient({
        detectSessionInUrl: false,
        isSingleton: false,
      });
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) {
        console.warn("Password reset update failed", {
          code: error.code,
          message: error.message,
          status: error.status,
        });
        setMessage("We couldn't update your password. Please try again.");
        return;
      }

      router.replace("/login?message=Your password has been updated. Log in with your new password.&messageTone=success");
      router.refresh();
    } catch (error) {
      console.warn("Password reset failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      setMessage("Something went wrong. Please try again.");
    }
  }

  if (isCheckingSession) {
    return (
      <p className="text-center text-secondary text-foreground-muted" role="status">
        Checking your reset link...
      </p>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        {message ? <FormMessage tone="error">{message}</FormMessage> : null}
        <Button href="/forgot-password" variant="secondary" className="w-full">
          Request a new reset link
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleResetPasswordSubmit)} noValidate>
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}

      <TextField
        id="new-password"
        label="New password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        helperText={`Use at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`}
        required
        {...register("password", { onChange: () => setMessage(undefined) })}
      />

      <TextField
        id="confirm-new-password"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        required
        {...register("confirmPassword", { onChange: () => setMessage(undefined) })}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating..." : "Update password"}
      </Button>

      <p className="text-center text-secondary text-foreground-muted">
        Back to{" "}
        <Link
          href="/login"
          className="text-label text-primary hover:text-primary-hover focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          login
        </Link>
      </p>
    </form>
  );
}
