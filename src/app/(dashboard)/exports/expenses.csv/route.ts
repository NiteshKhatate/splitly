import { NextResponse } from "next/server";

import { ExpenseExportError, exportExpensesCsv } from "@/lib/exports/expense-csv";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { expenseExportSchema } from "@/lib/validations/exports";
import { getDb } from "@/server/db";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to export expenses." }, { status: 401 });

  const url = new URL(request.url);
  const raw = {
    from: url.searchParams.get("from") || undefined,
    groupId: url.searchParams.get("groupId"),
    to: url.searchParams.get("to") || undefined,
  };
  const validation = expenseExportSchema.safeParse(raw);
  if (!validation.success) return NextResponse.json({ message: "Choose valid export filters." }, { status: 400 });

  try {
    const result = await exportExpensesCsv(getDb(), user.id, validation.data);
    return new Response(result.csv, {
      headers: {
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Content-Type": "text/csv; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof ExpenseExportError && error.code === "NOT_FOUND" ? 404 : 500;
    return NextResponse.json({ message: status === 404 ? "Group not found." : "Expenses could not be exported." }, { status });
  }
}
