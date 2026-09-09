import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSettlement, SettlementError } from "@/lib/settlements/create-settlement";
import { captureServerError } from "@/lib/monitoring/server-monitor";
import { readJsonBody, RequestBodyError } from "@/lib/security/request-body";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to record a settlement." }, { status: 401 });
  try {
    const result = await createSettlement(getDb(), groupId, user.id, await readJsonBody(request));
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}/balances`);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.code === "TOO_LARGE" ? 413 : 400 },
      );
    }
    if (error instanceof SettlementError) {
      return NextResponse.json({ message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400 });
    }
    await captureServerError("settlement_creation_failed", { groupId, userId: user.id });
    return NextResponse.json({ message: "We couldn't record that settlement." }, { status: 500 });
  }
}
