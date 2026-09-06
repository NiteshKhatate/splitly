import type { PrismaClient } from "@prisma/client";

export type AttachmentDatabase = Pick<PrismaClient, "attachment" | "expense">;

export async function listExpenseAttachments(database: AttachmentDatabase, expenseId: string, userId: string) {
  try {
    const expense = await database.expense.findFirst({
      select: { id: true },
      where: { deletedAt: null, id: expenseId, group: { members: { some: { userId } } } },
    });
    if (!expense) return { attachments: [], error: { message: "Expense not found." } };
    const attachments = await database.attachment.findMany({
      orderBy: { createdAt: "desc" },
      select: { byteSize: true, createdAt: true, fileName: true, id: true, mimeType: true },
      where: { expenseId },
    });
    return { attachments: attachments.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })), error: null };
  } catch {
    return { attachments: [], error: { message: "Receipts could not be loaded." } };
  }
}

export async function requireAttachmentAccess(database: AttachmentDatabase, attachmentId: string, expenseId: string, userId: string) {
  return database.attachment.findFirst({
    select: { fileName: true, id: true, storageKey: true },
    where: { id: attachmentId, expenseId, expense: { deletedAt: null, group: { members: { some: { userId } } } } },
  });
}

export async function requireAttachmentManager(database: AttachmentDatabase, attachmentId: string, expenseId: string, userId: string) {
  return database.attachment.findFirst({
    select: { id: true, storageKey: true },
    where: {
      id: attachmentId,
      expenseId,
      OR: [
        { uploadedBy: userId },
        { expense: { group: { members: { some: { role: "OWNER", userId } } } } },
      ],
    },
  });
}
