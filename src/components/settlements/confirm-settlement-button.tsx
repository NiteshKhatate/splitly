"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";

export function ConfirmSettlementButton({ groupId, settlementId }: {
  groupId: string;
  settlementId: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string>();

  async function confirm() {
    setConfirming(true);
    setMessage(undefined);
    try {
      const response = await fetch(`/groups/${groupId}/settlements/${settlementId}/confirm`, {
        method: "POST",
      });
      const body = await response.json() as { message?: string };
      if (!response.ok) {
        setMessage(body.message ?? "We couldn't confirm that settlement.");
        return;
      }
      router.refresh();
    } catch {
      setMessage("We couldn't confirm that settlement.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="mt-3">
      {message ? <FormMessage tone="error">{message}</FormMessage> : null}
      <Button type="button" onClick={confirm} disabled={confirming}>
        {confirming ? "Confirming..." : "Confirm payment"}
      </Button>
    </div>
  );
}
