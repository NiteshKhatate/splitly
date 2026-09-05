import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSettlement, SettlementError } from "@/lib/settlements/create-settlement";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(request: Request, { params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to record a settlement." }, { status: 401 });
  try {
    const result = await createSettlement(getDb(), groupId, user.id, await request.json());
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}/balances`);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof SettlementError) {
      return NextResponse.json({ message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400 });
    }
    return NextResponse.json({ message: "We couldn't record that settlement." }, { status: 500 });
  }
}
