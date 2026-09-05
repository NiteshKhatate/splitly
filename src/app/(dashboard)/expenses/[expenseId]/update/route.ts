import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ExpenseCreationError } from "@/lib/expenses/create-expense";
import { updateExpense } from "@/lib/expenses/manage-expense";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(request: Request, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to update this expense." }, { status: 401 });

  try {
    const result = await updateExpense(getDb(), expenseId, user.id, await request.json());
    revalidatePath("/dashboard");
    revalidatePath(`/expenses/${expenseId}`);
    revalidatePath(`/groups/${result.groupId}`);
    revalidatePath(`/groups/${result.groupId}/expenses`);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ExpenseCreationError) {
      return NextResponse.json({ message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400 });
    }
    return NextResponse.json({ message: "We couldn't update that expense." }, { status: 500 });
  }
}
