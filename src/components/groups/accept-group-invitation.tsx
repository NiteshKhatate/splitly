"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { ensureUserProfile } from "@/lib/auth/profiles";
import { acceptGroupInvitation } from "@/lib/groups/member-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  type InvitationAccountSetupData,
  invitationAccountSetupSchema,
  SIGNUP_PASSWORD_MIN_LENGTH,
} from "@/lib/validations/auth";
import { zodResolver } from "@/lib/validations/zod-resolver";

function getInvitationAcceptanceMessage(status: string | null) {
  if (status === "expired") {
    return "This invitation has expired. Ask a group admin to send a new one.";
  }

  if (status === "not_found" || status === "permission_denied") {
    return "This invitation doesn't match the account you're signed in with.";
  }

  return "We couldn't accept this invitation. Please try again.";
}

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
  const [message, setMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<InvitationAccountSetupData>({
    defaultValues: {
      fullName: "",
      password: "",
      confirmPassword: "",
    },
    resolver: zodResolver(invitationAccountSetupSchema),
  });

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
      reset({
        fullName: typeof metadataName === "string" ? metadataName : "",
        password: "",
        confirmPassword: "",
      });
      setIsLoading(false);
    }

    void establishInvitationSession();

    return () => {
      isActive = false;
    };
  }, [reset, supabase]);

  async function handleInvitationSubmit(values: InvitationAccountSetupData) {
    if (!session?.user.email) {
      return;
    }

    setMessage(undefined);

    try {
      const updateResult = await supabase.auth.updateUser({
        password: values.password,
        data: { full_name: values.fullName },
      });

      if (updateResult.error || !updateResult.data.user) {
        setMessage("We couldn't finish setting up your account. Please try again.");
        return;
      }

      const profileResult = await ensureUserProfile(
        supabase,
        updateResult.data.user,
        values.fullName,
      );

      if (profileResult.error) {
        setMessage("We couldn't prepare your profile. Please try again.");
        return;
      }

      const invitationResult = await acceptGroupInvitation(supabase, groupId);

      if (invitationResult.error) {
        setMessage("We couldn't accept this invitation. Please try again.");
        return;
      }

      if (
        invitationResult.data !== "accepted"
        && invitationResult.data !== "already_member"
      ) {
        setMessage(getInvitationAcceptanceMessage(invitationResult.data));
        return;
      }

      router.replace(`/groups/${groupId}`);
      router.refresh();
    } catch {
      setMessage("We couldn't accept this invitation. Please try again.");
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
          <form className="space-y-5" onSubmit={handleSubmit(handleInvitationSubmit)} noValidate>
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
              label="Full name"
              autoComplete="name"
              error={errors.fullName?.message}
              required
              {...register("fullName", { onChange: () => setMessage(undefined) })}
            />
            <TextField
              id="invitation-password"
              label="Password"
              type="password"
              autoComplete="new-password"
              error={errors.password?.message}
              helperText={`Use at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`}
              required
              {...register("password", { onChange: () => setMessage(undefined) })}
            />
            <TextField
              id="invitation-confirm-password"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              required
              {...register("confirmPassword", { onChange: () => setMessage(undefined) })}
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
