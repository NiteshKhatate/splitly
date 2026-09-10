"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { showToast } from "@/components/ui/toast";

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
        const errorMessage = body.message ?? "We couldn't confirm that settlement.";
        setMessage(errorMessage);
        showToast({ message: errorMessage, tone: "error" });
        return;
      }
      showToast({ message: "Settlement confirmed.", tone: "success" });
      router.refresh();
    } catch {
      const errorMessage = "We couldn't confirm that settlement.";
      setMessage(errorMessage);
      showToast({ message: errorMessage, tone: "error" });
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
