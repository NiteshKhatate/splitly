import { NextResponse } from "next/server";

import { requireAttachmentAccess, requireAttachmentManager } from "@/lib/receipts/attachments";
import { captureServerError } from "@/lib/monitoring/server-monitor";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDb } from "@/server/db";

type Params = { params: Promise<{ attachmentId: string; expenseId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { attachmentId, expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to view this receipt." }, { status: 401 });
  const attachment = await requireAttachmentAccess(getDb(), attachmentId, expenseId, user.id);
  if (!attachment) return NextResponse.json({ message: "Receipt not found." }, { status: 404 });
  const signed = await createSupabaseAdminClient().storage.from("receipts").createSignedUrl(attachment.storageKey, 60, { download: attachment.fileName });
  if (signed.error) {
    await captureServerError("receipt_signed_url_failed", { attachmentId, expenseId, userId: user.id });
    return NextResponse.json({ message: "Receipt could not be opened." }, { status: 500 });
  }
  return NextResponse.redirect(signed.data.signedUrl);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { attachmentId, expenseId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Sign in to delete this receipt." }, { status: 401 });
  const database = getDb();
  const attachment = await requireAttachmentManager(database, attachmentId, expenseId, user.id);
  if (!attachment) return NextResponse.json({ message: "Receipt not found." }, { status: 404 });
  const tombstone = await database.attachment.updateMany({
    data: { deletedAt: new Date() },
    where: { deletedAt: null, id: attachment.id },
  });
  if (tombstone.count !== 1) {
    return NextResponse.json({ message: "Receipt changed. Refresh and try again." }, { status: 409 });
  }
  const removed = await createSupabaseAdminClient().storage.from("receipts").remove([attachment.storageKey]);
  if (removed.error) {
    await captureServerError("receipt_storage_cleanup_deferred", {
      attachmentId,
      expenseId,
      userId: user.id,
    });
    return NextResponse.json({ deleted: true, pendingCleanup: true }, { status: 202 });
  }
  await database.attachment.deleteMany({ where: { deletedAt: { not: null }, id: attachment.id } });
  return NextResponse.json({ deleted: true, pendingCleanup: false });
}
