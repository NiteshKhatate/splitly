import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { captureServerError } from "@/lib/monitoring/server-monitor";
import {
  cleanupDeletedAttachments,
  cleanupExpiredRateLimitBuckets,
} from "@/lib/receipts/cleanup";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
  if (!validCronAuthorization(request)) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  try {
    const storage = createSupabaseAdminClient().storage.from("receipts");
    const database = getDb();
    const attachments = await cleanupDeletedAttachments(
      database,
      async (keys) => storage.remove(keys),
    );
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1_000);
    const deletedRateLimitBuckets = await cleanupExpiredRateLimitBuckets(database, thirtyDaysAgo);
    return NextResponse.json({ attachments, deletedRateLimitBuckets });
  } catch {
    await captureServerError("maintenance_processing_failed");
    return NextResponse.json({ message: "Maintenance processing failed." }, { status: 500 });
  }
}
