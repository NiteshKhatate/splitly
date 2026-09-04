"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type ForgotPasswordFormData,
  forgotPasswordFormSchema,
} from "@/lib/validations/auth";
import { zodResolver } from "@/lib/validations/zod-resolver";

type Message = {
  tone: "error" | "success";
  text: string;
};

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<Message | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
    },
    resolver: zodResolver(forgotPasswordFormSchema),
  });

  async function handleForgotPasswordSubmit(values: ForgotPasswordFormData) {
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.warn("Password reset email failed", {
          code: error.code,
          message: error.message,
          status: error.status,
        });
        setMessage({
          tone: "error",
          text: "We couldn't send a reset link. Please try again.",
        });
        return;
      }

      setMessage({
        tone: "success",
        text: "If an account exists for that email, a password reset link has been sent.",
      });
    } catch (error) {
      console.warn("Password reset request failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      setMessage({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleForgotPasswordSubmit)} noValidate>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <TextField
        id="reset-email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        required
        {...register("email", { onChange: () => setMessage(null) })}
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send reset link"}
      </Button>

      <p className="text-center text-secondary text-foreground-muted">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-label text-primary hover:text-primary-hover focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
