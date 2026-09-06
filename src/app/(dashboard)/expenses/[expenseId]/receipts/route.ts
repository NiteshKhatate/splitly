import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { receiptFileSchema } from "@/lib/validations/receipts";
import { getDb } from "@/server/db";

const extensionByType = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png" } as const;

export async function POST(request: Request, { params }: { params: Promise<{ expenseId: string }> }) {
  const { expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to upload a receipt." }, { status: 401 });
  const rateLimit = await consumeRateLimit(getDb(), `receipt-upload:${expenseId}`, user.id, 10, 3600);
  if (!rateLimit.allowed) return NextResponse.json(
    { message: "Too many receipt uploads. Please try again later." },
    { headers: { "Retry-After": String(rateLimit.retryAfterSeconds) }, status: 429 },
  );
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 5_500_000) return NextResponse.json({ message: "Receipt files must be 5 MB or smaller." }, { status: 413 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("receipt");
  if (!(file instanceof File)) return NextResponse.json({ message: "Choose a receipt file." }, { status: 400 });
  const validation = receiptFileSchema.safeParse(file);
  if (!validation.success) return NextResponse.json({ message: validation.error.issues[0]?.message ?? "Choose a valid receipt." }, { status: 400 });

  const database = getDb();
  const expense = await database.expense.findFirst({
    select: { groupId: true, id: true },
    where: { deletedAt: null, id: expenseId, group: { members: { some: { userId: user.id } } } },
  }).catch(() => null);
  if (!expense) return NextResponse.json({ message: "Expense not found." }, { status: 404 });

  const key = `${expense.groupId}/${expense.id}/${crypto.randomUUID()}.${extensionByType[validation.data.type]}`;
  const admin = createSupabaseAdminClient();
  const upload = await admin.storage.from("receipts").upload(key, await file.arrayBuffer(), { contentType: validation.data.type, upsert: false });
  if (upload.error) return NextResponse.json({ message: "We couldn't upload that receipt." }, { status: 500 });
  try {
    const attachment = await database.attachment.create({
      data: { byteSize: file.size, expenseId, fileName: file.name, mimeType: validation.data.type, storageKey: key, uploadedBy: user.id },
      select: { id: true },
    });
    revalidatePath(`/expenses/${expenseId}`);
    return NextResponse.json(attachment, { status: 201 });
  } catch {
    await admin.storage.from("receipts").remove([key]);
    return NextResponse.json({ message: "We couldn't save that receipt." }, { status: 500 });
  }
}
