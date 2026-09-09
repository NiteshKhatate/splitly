import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ExpenseCreationError } from "@/lib/expenses/create-expense";
import { deleteExpense } from "@/lib/expenses/manage-expense";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

export async function POST(request: Request, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to delete this expense." }, { status: 401 });

  try {
    const body: unknown = await request.json();
    const expectedUpdatedAt = body && typeof body === "object" && "expectedUpdatedAt" in body
      ? body.expectedUpdatedAt
      : undefined;
    const result = await deleteExpense(
      getDb(),
      expenseId,
      user.id,
      typeof expectedUpdatedAt === "string" ? expectedUpdatedAt : "",
    );
    revalidatePath("/dashboard");
    revalidatePath(`/groups/${result.groupId}`);
    revalidatePath(`/groups/${result.groupId}/expenses`);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ExpenseCreationError) {
      const status = error.code === "CONFLICT"
        ? 409
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
            ? 404
            : 400;
      return NextResponse.json({ message: error.message }, { status });
    }
    return NextResponse.json({ message: "We couldn't delete that expense." }, { status: 500 });
  }
}
