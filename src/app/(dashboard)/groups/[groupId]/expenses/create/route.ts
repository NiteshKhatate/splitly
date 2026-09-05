import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createExpense, ExpenseCreationError } from "@/lib/expenses/create-expense";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in to add an expense." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "The expense details are invalid." }, { status: 400 });
  }

  try {
    const result = await createExpense(getDb(), groupId, user.id, body);
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${groupId}`);
    revalidatePath(`/groups/${groupId}/expenses`);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ExpenseCreationError) {
      const status = error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ message: error.message }, { status });
    }

    console.warn("Expense creation failed", { groupId, userId: user.id });
    return NextResponse.json(
      { message: "We couldn't save that expense. Please try again." },
      { status: 500 },
    );
  }
}
