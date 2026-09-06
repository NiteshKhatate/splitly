import "server-only";

import type { ReminderMessage } from "./process-reminders";

class ReminderProviderError extends Error {
  code: string;

  constructor(code: string) {
    super("Reminder delivery failed.");
    this.code = code;
  }
}

export async function sendReminderEmail(message: ReminderMessage): Promise<{ providerId: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_FROM_EMAIL;
  if (!apiKey || !from) throw new ReminderProviderError("PROVIDER_NOT_CONFIGURED");

  const amount = new Intl.NumberFormat("en-IN", {
    currency: message.currency,
    style: "currency",
  }).format(message.amountMinor / 100);
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      subject: `Balance reminder for ${message.groupName}`,
      text: `You currently owe ${amount} in ${message.groupName}. Sign in to Splitly to review the balance.`,
      to: [message.email],
    }),
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    method: "POST",
  });
  if (!response.ok) throw new ReminderProviderError(`PROVIDER_${response.status}`);
  const body = await response.json() as { id?: unknown };
  if (typeof body.id !== "string") throw new ReminderProviderError("PROVIDER_INVALID_RESPONSE");
  return { providerId: body.id };
}
