import { NextResponse } from "next/server";

import { getDb } from "@/server/db";

export async function GET() {
  const startedAt = Date.now();
  try {
    await getDb().$queryRaw`SELECT 1`;
    return NextResponse.json({
      database: "available",
      responseTimeMs: Date.now() - startedAt,
      status: "ok",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({
      database: "unavailable",
      responseTimeMs: Date.now() - startedAt,
      status: "degraded",
    }, { headers: { "Cache-Control": "no-store" }, status: 503 });
  }
}
