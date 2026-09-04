"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SIGNUP_PASSWORD_MIN_LENGTH,
  type SignupFormData,
  signupFormSchema,
} from "@/lib/validations/auth";
import { zodResolver } from "@/lib/validations/zod-resolver";

const initialFormState: SignupFormData = {
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
  const [formMessage, setFormMessage] = useState<FormMessage | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<SignupFormData>({
    defaultValues: initialFormState,
    resolver: zodResolver(signupFormSchema),
  });

  function clearFormMessage() {
    setFormMessage(null);
  }

  async function handleSignupSubmit(values: SignupFormData) {
    setFormMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: {
            full_name: values.fullName,
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
        reset(initialFormState);
        setFormMessage({
          tone: "success",
          text: "Account created. Check your email to confirm your account, then log in to Splitly.",
        });
        return;
      }

      if (data.user && data.session) {
        const { error: profileError } = await ensureUserProfile(supabase, data.user, values.fullName);

        if (profileError) {
          console.warn("Supabase profile setup failed after signup", {
            code: profileError.code,
            message: profileError.message,
          });
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (signupError) {
      console.warn("Signup failed", {
        message: signupError instanceof Error ? signupError.message : String(signupError),
      });
      setFormMessage({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(handleSignupSubmit)} noValidate>
      {formMessage ? (
        <FormMessage tone={formMessage.tone}>{formMessage.text}</FormMessage>
      ) : null}

      <TextField
        id="full-name"
        label="Full name"
        autoComplete="name"
        error={errors.fullName?.message}
        required
        {...register("fullName", { onChange: clearFormMessage })}
      />

      <TextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        inputMode="email"
        error={errors.email?.message}
        required
        {...register("email", { onChange: clearFormMessage })}
      />

      <TextField
        id="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        error={errors.password?.message}
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
        required
        {...register("password", { onChange: clearFormMessage })}
      />

      <TextField
        id="confirm-password"
        label="Confirm password"
        type={showConfirmPassword ? "text" : "password"}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
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
        required
        {...register("confirmPassword", { onChange: clearFormMessage })}
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
