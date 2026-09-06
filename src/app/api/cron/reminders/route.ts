import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { sendReminderEmail } from "@/lib/reminders/email-provider";
import { processBalanceReminders } from "@/lib/reminders/process-reminders";
import { getDb } from "@/server/db";

function validCronAuthorization(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ message: "Reminder scheduling is not configured." }, { status: 503 });
  }
  if (!validCronAuthorization(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    return NextResponse.json(await processBalanceReminders(getDb(), sendReminderEmail));
  } catch {
    return NextResponse.json({ message: "Reminder processing failed." }, { status: 500 });
  }
}
