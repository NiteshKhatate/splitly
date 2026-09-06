"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { logError } from "@/lib/monitoring/redaction";

export default function ApplicationError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logError("Unexpected application error", { digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md rounded-card border border-border bg-surface p-6 text-center shadow-sm">
        <h1 className="text-page-heading">Something went wrong</h1>
        <p className="mt-3 text-secondary text-foreground-muted">We couldn&apos;t load this page. Please try again.</p>
        <Button className="mt-6" onClick={reset} type="button">Try again</Button>
      </div>
    </main>
  );
}
