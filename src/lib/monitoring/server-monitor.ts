import "server-only";

import { logError, redactForLogging } from "./redaction";

export async function captureServerError(event: string, context: Record<string, unknown> = {}) {
  const safeContext = redactForLogging(context) as Record<string, unknown>;
  logError(event, safeContext);
  const endpoint = process.env.ERROR_MONITORING_WEBHOOK_URL;
  if (!endpoint) return;
  await fetch(endpoint, {
    body: JSON.stringify({ context: safeContext, event, occurredAt: new Date().toISOString() }),
    headers: {
      "Content-Type": "application/json",
      ...(process.env.ERROR_MONITORING_TOKEN ? { Authorization: `Bearer ${process.env.ERROR_MONITORING_TOKEN}` } : {}),
    },
    method: "POST",
    signal: AbortSignal.timeout(3_000),
  }).catch(() => undefined);
}
