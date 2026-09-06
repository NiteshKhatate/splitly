import { createHash } from "node:crypto";

import type { PrismaClient } from "@prisma/client";

export type RateLimitDatabase = Pick<PrismaClient, "$queryRaw">;

export async function consumeRateLimit(
  database: RateLimitDatabase,
  scope: string,
  identifier: string,
  maximum: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || !Number.isSafeInteger(windowSeconds) || windowSeconds < 1) {
    throw new Error("Invalid rate-limit configuration.");
  }
  const key = createHash("sha256").update(`${scope}:${identifier}`).digest("hex");
  const rows = await database.$queryRaw<Array<{ count: number; windowStart: Date }>>`
    INSERT INTO public.rate_limit_buckets (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN public.rate_limit_buckets.window_start <= now() - (${windowSeconds} * interval '1 second') THEN 1
        ELSE public.rate_limit_buckets.count + 1
      END,
      window_start = CASE
        WHEN public.rate_limit_buckets.window_start <= now() - (${windowSeconds} * interval '1 second') THEN now()
        ELSE public.rate_limit_buckets.window_start
      END,
      updated_at = now()
    RETURNING count, window_start AS "windowStart"
  `;
  const row = rows[0];
  if (!row) throw new Error("Rate limit could not be evaluated.");
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - row.windowStart.getTime()) / 1000));
  return { allowed: row.count <= maximum, retryAfterSeconds: Math.max(1, windowSeconds - elapsedSeconds) };
}
