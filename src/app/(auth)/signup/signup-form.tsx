"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SIGNUP_PASSWORD_MIN_LENGTH,
  SignupFormErrors,
  validateSignupForm,
} from "@/lib/validations/auth";

type FormState = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type FormMessage = {
  tone: "error" | "success";
  text: string;
};

function getFriendlySignupError(error: AuthError) {
  const lowerMessage = error.message.toLowerCase();

  if (error.code === "email_address_invalid") {
    return "Please enter a valid email address.";
  }

  if (lowerMessage.includes("already registered")) {
    return "An account already exists for this email. Log in instead.";
  }

  if (error.code === "over_email_send_rate_limit") {
    return "Too many confirmation emails were requested. Please wait a moment, then try again.";
  }

  if (error.code === "email_exists" || error.code === "user_already_exists") {
    return "An account already exists for this email. Log in instead.";
  }

  if (error.code === "email_provider_disabled") {
    return "Email signup is not enabled for this project.";
  }

  if (lowerMessage.includes("password")) {
    return "Your password does not meet the signup requirements.";
  }

  return "We could not create your account. Please try again.";
}

export function SignupForm() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const nextErrors = validateSignupForm(formState);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setFormMessage({
        tone: "error",
        text: "Please fix the highlighted fields.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormMessage(null);

    const fullName = formState.fullName.trim();
    const email = formState.email.trim().toLowerCase();

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: formState.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        console.error("Supabase signup failed", {
          code: error.code,
          message: error.message,
          status: error.status,
        });
        setFormMessage({
          tone: "error",
          text: getFriendlySignupError(error),
        });
        return;
      }

      if (data.user && !data.session) {
        setFormState(initialFormState);
        setFormMessage({
          tone: "success",
          text: "Account created. Check your email to confirm your account, then log in to Splitly.",
        });
        return;
      }

      if (data.user && data.session) {
        const { error: profileError } = await ensureUserProfile(supabase, data.user, fullName);

        if (profileError) {
          console.warn("Supabase profile setup failed after signup", {
            code: profileError.code,
            message: profileError.message,
          });
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormMessage({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {formMessage ? (
        <FormMessage tone={formMessage.tone}>{formMessage.text}</FormMessage>
      ) : null}

      <TextField
        id="full-name"
        name="fullName"
        label="Full name"
        autoComplete="name"
        value={formState.fullName}
        error={errors.fullName}
        onChange={(event) => updateField("fullName", event.target.value)}
        required
      />

      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={formState.email}
        error={errors.email}
        onChange={(event) => updateField("email", event.target.value)}
        required
      />

      <TextField
        id="password"
        name="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        value={formState.password}
        error={errors.password}
        helperText={`Use at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`}
        action={
          <button
            type="button"
            className="text-label text-primary hover:text-primary-hover focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setShowPassword((current) => !current)}
            aria-controls="password"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
        onChange={(event) => updateField("password", event.target.value)}
        required
      />

      <TextField
        id="confirm-password"
        name="confirmPassword"
        label="Confirm password"
        type={showConfirmPassword ? "text" : "password"}
        autoComplete="new-password"
        value={formState.confirmPassword}
        error={errors.confirmPassword}
        action={
          <button
            type="button"
            className="text-label text-primary hover:text-primary-hover focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => setShowConfirmPassword((current) => !current)}
            aria-controls="confirm-password"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        }
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        required
      />

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>

      <p className="text-center text-secondary text-foreground-muted">
        Already have an account?{" "}
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
