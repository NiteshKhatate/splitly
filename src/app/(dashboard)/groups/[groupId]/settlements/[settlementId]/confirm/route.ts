import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { confirmSettlement } from "@/lib/settlements/confirm-settlement";
import { SettlementError } from "@/lib/settlements/create-settlement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(_request: Request, { params }: {
  params: Promise<{ groupId: string; settlementId: string }>;
}) {
  const { groupId, settlementId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to confirm a settlement." }, { status: 401 });

  try {
    const result = await confirmSettlement(getDb(), groupId, settlementId, user.id);
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}/balances`);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SettlementError) {
      return NextResponse.json({ message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400 });
    }
    return NextResponse.json({ message: "We couldn't confirm that settlement." }, { status: 500 });
  }
}
