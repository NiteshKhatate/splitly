"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  SIGNUP_PASSWORD_MIN_LENGTH,
  validateSignupForm,
} from "@/lib/validations/auth";

type InvitationFormErrors = {
  fullName?: string;
  password?: string;
  confirmPassword?: string;
};

function cleanAuthParameters() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

export function AcceptGroupInvitation({ groupId }: { groupId: string }) {
  const router = useRouter();
  const supabase = useMemo(
    () => createSupabaseBrowserClient({ detectSessionInUrl: false, isSingleton: false }),
    [],
  );
  const didInitialize = useRef(false);
  const [session, setSession] = useState<Session>();
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<InvitationFormErrors>({});
  const [message, setMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;

    let isActive = true;

    async function establishInvitationSession() {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const query = new URLSearchParams(window.location.search);
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const code = query.get("code");
      const tokenHash = query.get("token_hash");
      const otpType = query.get("type") as EmailOtpType | null;
      let activeSession: Session | null = null;

      if (accessToken && refreshToken) {
        const result = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (result.error) {
          if (isActive) setMessage("This invitation link is invalid or has expired.");
          if (isActive) setIsLoading(false);
          return;
        }

        activeSession = result.data.session;
        cleanAuthParameters();
      } else if (code) {
        const result = await supabase.auth.exchangeCodeForSession(code);

        if (result.error) {
          if (isActive) setMessage("This invitation link is invalid or has expired.");
          if (isActive) setIsLoading(false);
          return;
        }

        activeSession = result.data.session;
        cleanAuthParameters();
      } else if (tokenHash && otpType) {
        const result = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        });

        if (result.error) {
          if (isActive) setMessage("This invitation link is invalid or has expired.");
          if (isActive) setIsLoading(false);
          return;
        }

        activeSession = result.data.session;
        cleanAuthParameters();
      } else {
        const result = await supabase.auth.getSession();
        activeSession = result.data.session;
      }

      if (!isActive) return;

      if (!activeSession) {
        setMessage("Open the invitation link from your email to continue.");
        setIsLoading(false);
        return;
      }

      const metadataName = activeSession.user.user_metadata?.full_name;
      setSession(activeSession);
      setFullName(typeof metadataName === "string" ? metadataName : "");
      setIsLoading(false);
    }

    void establishInvitationSession();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!session?.user.email || isSubmitting) {
      return;
    }

    const validationErrors = validateSignupForm({
      fullName,
      email: session.user.email,
      password,
      confirmPassword,
    });
    const nextErrors: InvitationFormErrors = {
      fullName: validationErrors.fullName,
      password: validationErrors.password,
      confirmPassword: validationErrors.confirmPassword,
    };

    setErrors(nextErrors);
    setMessage(undefined);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updateResult = await supabase.auth.updateUser({
        password,
        data: { full_name: fullName.trim() },
      });

      if (updateResult.error || !updateResult.data.user) {
        setMessage("We couldn't finish setting up your account. Please try again.");
        return;
      }

      const profileResult = await ensureUserProfile(
        supabase,
        updateResult.data.user,
        fullName,
      );

      if (profileResult.error) {
        setMessage("We couldn't prepare your profile. Please try again.");
        return;
      }

      const response = await fetch(`/groups/${groupId}/invitations/accept`, {
        method: "POST",
      });
      const data = await response.json() as {
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok || !data.redirectTo) {
        setMessage(data.message ?? "We couldn't accept this invitation. Please try again.");
        return;
      }

      router.replace(data.redirectTo);
      router.refresh();
    } catch {
      setMessage("We couldn't accept this invitation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="w-full max-w-md" aria-labelledby="invitation-heading">
      <Link
        href="/"
        className="mx-auto mb-8 flex w-fit items-center gap-3 text-card-heading focus-visible:rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <span className="flex size-10 items-center justify-center rounded-control bg-primary text-label text-white">
          S
        </span>
        <span>Splitly</span>
      </Link>

      <Card>
        <div className="mb-6 text-center">
          <h1 id="invitation-heading" className="text-page-heading">
            Join your group
          </h1>
          <p className="mt-3 text-secondary text-foreground-muted">
            Set up your Splitly account to accept this invitation.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-secondary text-foreground-muted" role="status">
            Checking your invitation...
          </p>
        ) : session ? (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {message ? <FormMessage tone="error">{message}</FormMessage> : null}
            <TextField
              id="invitation-email"
              name="email"
              label="Email"
              type="email"
              value={session.user.email ?? ""}
              disabled
            />
            <TextField
              id="invitation-full-name"
              name="fullName"
              label="Full name"
              autoComplete="name"
              value={fullName}
              error={errors.fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                setErrors((current) => ({ ...current, fullName: undefined }));
              }}
              required
            />
            <TextField
              id="invitation-password"
              name="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              value={password}
              error={errors.password}
              helperText={`Use at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              required
            />
            <TextField
              id="invitation-confirm-password"
              name="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              error={errors.confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setErrors((current) => ({ ...current, confirmPassword: undefined }));
              }}
              required
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Joining group..." : "Create account and join"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {message ? <FormMessage tone="error">{message}</FormMessage> : null}
            <Button href="/login" variant="secondary" className="w-full">
              Log in to Splitly
            </Button>
          </div>
        )}
      </Card>
    </section>
  );
}
