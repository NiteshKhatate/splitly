import { deleteExpense, updateExpense } from "./manage-expense";

const actorId = "00000000-0000-4000-8000-000000000001";
const memberId = "00000000-0000-4000-8000-000000000002";

const input = {
  amount: "10", category: "DINING", currency: "INR", date: "2026-09-04",
  description: "Dinner", notes: "",
  participants: [
    { exactAmount: "5", included: true, memberId: actorId, percentage: "", shares: "1" },
    { exactAmount: "5", included: true, memberId, percentage: "", shares: "1" },
  ],
  payers: [{ amount: "10", memberId: actorId }, { amount: "", memberId }],
  splitMethod: "EXACT",
};

function transaction(expense: unknown) {
  return {
    activityEvent: { create: jest.fn().mockResolvedValue({}) },
    expense: {
      findFirst: jest.fn().mockResolvedValue(expense),
      update: jest.fn().mockResolvedValue({}),
    },
    expensePayment: {
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    expenseShare: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    groupMember: {
      findMany: jest.fn().mockResolvedValue([{ userId: actorId }, { userId: memberId }]),
    },
  };
}

function database(tx: ReturnType<typeof transaction>) {
  return { $transaction: jest.fn(async (callback: (value: typeof tx) => unknown) => callback(tx)) };
}

describe("expense management", () => {
  it("updates the expense, replaces ledger rows, and records activity atomically", async () => {
    const tx = transaction({ createdBy: actorId, group: { members: [{ userId: actorId }] }, groupId: "group-1" });

    await expect(updateExpense(database(tx) as never, "expense-1", actorId, input)).resolves.toEqual({ expenseId: "expense-1", groupId: "group-1" });
    expect(tx.expense.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ totalMinor: 1000 }) }));
    expect(tx.expensePayment.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.expensePayment.createMany.mock.invocationCallOrder[0]);
    expect(tx.expenseShare.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.expenseShare.createMany.mock.invocationCallOrder[0]);
    expect(tx.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "EXPENSE_UPDATED" }) }));
  });

  it("rejects non-creators, including group owners", async () => {
    const memberTx = transaction({ createdBy: "someone-else", group: { members: [{ userId: actorId }] }, groupId: "group-1" });
    await expect(updateExpense(database(memberTx) as never, "expense-1", actorId, input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(memberTx.expense.update).not.toHaveBeenCalled();
  });

  it("soft deletes without removing historical ledger rows", async () => {
    const tx = transaction({ createdBy: actorId, description: "Dinner", group: { members: [{ userId: actorId }] }, groupId: "group-1" });

    await expect(deleteExpense(database(tx) as never, "expense-1", actorId)).resolves.toEqual({ groupId: "group-1" });
    expect(tx.expense.update).toHaveBeenCalledWith({ where: { id: "expense-1" }, data: { deletedAt: expect.any(Date) } });
    expect(tx.expensePayment.deleteMany).not.toHaveBeenCalled();
    expect(tx.expenseShare.deleteMany).not.toHaveBeenCalled();
    expect(tx.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "EXPENSE_DELETED" }) }));
  });

  it("rejects a non-creator delete", async () => {
    const tx = transaction({
      createdBy: "someone-else",
      description: "Dinner",
      group: { members: [{ userId: actorId }] },
      groupId: "group-1",
    });

    await expect(deleteExpense(database(tx) as never, "expense-1", actorId))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(tx.expense.update).not.toHaveBeenCalled();
  });

  it("propagates mutation failures for transaction rollback", async () => {
    const tx = transaction({ createdBy: actorId, group: { members: [{ userId: actorId }] }, groupId: "group-1" });
    tx.expenseShare.createMany.mockRejectedValue(new Error("write failed"));
    await expect(updateExpense(database(tx) as never, "expense-1", actorId, input)).rejects.toThrow("write failed");
    expect(tx.activityEvent.create).not.toHaveBeenCalled();
  });
});
