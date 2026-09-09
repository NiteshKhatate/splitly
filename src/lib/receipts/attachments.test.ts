import { listExpenseAttachments, requireAttachmentAccess, requireAttachmentManager } from "./attachments";

function database(expense: unknown = { id: "expense-1" }) {
  return {
    attachment: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    expense: { findFirst: jest.fn().mockResolvedValue(expense) },
  };
}

describe("receipt attachment authorization", () => {
  it("requires group membership before listing receipts", async () => {
    const db = database(null);
    expect(await listExpenseAttachments(db as never, "expense-1", "outsider")).toEqual({ attachments: [], error: { message: "Expense not found." } });
    expect(db.attachment.findMany).not.toHaveBeenCalled();
  });

  it("scopes signed access to the expense and an active member", async () => {
    const db = database();
    await requireAttachmentAccess(db as never, "attachment-1", "expense-1", "user-1");
    expect(db.attachment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      deletedAt: null,
      expense: { deletedAt: null, group: { members: { some: { userId: "user-1" } } } },
      expenseId: "expense-1", id: "attachment-1",
    }) }));
  });

  it("allows deletion only by the uploader or a group owner", async () => {
    const db = database();
    await requireAttachmentManager(db as never, "attachment-1", "expense-1", "user-1");
    expect(db.attachment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({
      OR: [{ uploadedBy: "user-1" }, { expense: { group: { members: { some: { role: "OWNER", userId: "user-1" } } } } }],
      deletedAt: null,
      expense: { deletedAt: null, group: { members: { some: { userId: "user-1" } } } },
    }) }));
  });
});
