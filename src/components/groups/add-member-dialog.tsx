"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import type { AddMemberCandidate } from "@/lib/groups/add-member-form-state";
import { validateGroupMemberEmail } from "@/lib/validations/groups";

type FormMessageState = {
  text: string;
  tone: "error" | "success";
};

export function AddMemberDialog({
  groupId,
  variant = "button",
}: {
  groupId: string;
  variant?: "button" | "link";
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [message, setMessage] = useState<FormMessageState>();
  const [candidate, setCandidate] = useState<AddMemberCandidate>();
  const [invitableEmail, setInvitableEmail] = useState<string>();
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const nextFieldError = validateGroupMemberEmail(normalizedEmail);

    setFieldError(nextFieldError);
    setMessage(undefined);
    setCandidate(undefined);
    setInvitableEmail(undefined);

    if (nextFieldError) {
      return;
    }

    setIsSearching(true);

    try {
      const response = await fetch(`/groups/${groupId}/members/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json() as {
        candidate?: AddMemberCandidate;
        fieldError?: string;
        invitableEmail?: string;
        message?: string;
      };

      if (!response.ok) {
        setFieldError(data.fieldError);
        setMessage(data.message ? { text: data.message, tone: "error" } : undefined);
        return;
      }

      if (data.candidate) {
        setCandidate(data.candidate);
      }

      if (data.invitableEmail) {
        setInvitableEmail(data.invitableEmail);
      }
    } catch {
      setMessage({ text: "We couldn't search for that person. Please try again.", tone: "error" });
    } finally {
      setIsSearching(false);
    }
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!invitableEmail) {
      return;
    }

    setIsInviting(true);
    setMessage(undefined);

    try {
      const response = await fetch(`/groups/${groupId}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: invitableEmail }),
      });
      const data = await response.json() as {
        fieldError?: string;
        message?: string;
      };

      if (!response.ok) {
        setFieldError(data.fieldError);
        setMessage(data.message ? { text: data.message, tone: "error" } : undefined);
        return;
      }

      setEmail("");
      setInvitableEmail(undefined);
      setMessage({
        text: data.message ?? `Invitation sent to ${invitableEmail}.`,
        tone: "success",
      });
    } catch {
      setMessage({ text: "We couldn't send that invitation. Please try again.", tone: "error" });
    } finally {
      setIsInviting(false);
    }
  }

  async function handleAddPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!candidate) {
      return;
    }

    setIsAdding(true);
    setMessage(undefined);

    try {
      const response = await fetch(`/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: candidate.email }),
      });
      const data = await response.json() as {
        fieldError?: string;
        message?: string;
      };

      if (!response.ok) {
        setFieldError(data.fieldError);
        setMessage(data.message ? { text: data.message, tone: "error" } : undefined);
        return;
      }

      setEmail("");
      setCandidate(undefined);
      setMessage({
        text: data.message ?? `${candidate.name} was added to the group.`,
        tone: "success",
      });
      router.refresh();
    } catch {
      setMessage({ text: "We couldn't add that person. Please try again.", tone: "error" });
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <>
      {variant === "link" ? (
        <button
          type="button"
          className="rounded-control text-label text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={() => setIsOpen(true)}
        >
          + Add people
        </button>
      ) : (
        <Button type="button" className="w-full sm:w-auto" onClick={() => setIsOpen(true)}>
          + Add people
        </Button>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div
            aria-labelledby="add-member-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-card border border-border bg-surface p-5 shadow-sm sm:p-6"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="add-member-title" className="text-card-heading">Add people</h2>
                <p className="mt-1 text-secondary text-foreground-muted">
                  Add an existing Splitly user or invite someone new by email.
                </p>
              </div>
              <button
                type="button"
                className="rounded-control px-2 py-1 text-label text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => setIsOpen(false)}
                aria-label="Close add people dialog"
              >
                <XIcon size={18} weight="bold" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-5">
              {message ? (
                <FormMessage tone={message.tone}>{message.text}</FormMessage>
              ) : null}

              <form onSubmit={handleSearch} className="space-y-4" noValidate>
                <TextField
                  id="member-email"
                  name="email"
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  error={fieldError}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFieldError(undefined);
                    setMessage(undefined);
                    setCandidate(undefined);
                    setInvitableEmail(undefined);
                  }}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="secondary" disabled={isSearching}>
                    {isSearching ? "Searching..." : "Find person"}
                  </Button>
                </div>
              </form>

              {candidate ? (
                <div className="rounded-control border border-border bg-surface-muted p-4">
                  <p className="text-caption text-foreground-muted">A matching user was found:</p>
                  <p className="mt-2 text-label text-foreground">{candidate.name}</p>
                  <p className="mt-1 text-secondary text-foreground-muted">{candidate.email}</p>
                  <form onSubmit={handleAddPerson} className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isAdding}>
                      {isAdding ? "Adding..." : "Add person"}
                    </Button>
                  </form>
                </div>
              ) : invitableEmail ? (
                <div className="rounded-control border border-border bg-surface-muted p-4">
                  <p className="text-label text-foreground">No Splitly account yet</p>
                  <p className="mt-1 break-words text-secondary text-foreground-muted">
                    Send an invitation to {invitableEmail} to create an account and join this group.
                  </p>
                  <form onSubmit={handleInvite} className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isInviting}>
                      {isInviting ? "Sending..." : "Send invite"}
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
