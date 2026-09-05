import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ExpenseCreationError } from "@/lib/expenses/create-expense";
import { deleteExpense } from "@/lib/expenses/manage-expense";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(_request: Request, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to delete this expense." }, { status: 401 });

  try {
    const result = await deleteExpense(getDb(), expenseId, user.id);
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${result.groupId}`);
    revalidatePath(`/groups/${result.groupId}/expenses`);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ExpenseCreationError) {
      return NextResponse.json({ message: error.message }, { status: error.code === "FORBIDDEN" ? 403 : 404 });
    }
    return NextResponse.json({ message: "We couldn't delete that expense." }, { status: 500 });
  }
}
