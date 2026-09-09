import { deleteExpense, updateExpense } from "./manage-expense";

const actorId = "00000000-0000-4000-8000-000000000001";
const memberId = "00000000-0000-4000-8000-000000000002";
const version = "2026-09-09T10:00:00.000Z";

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
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
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
    const tx = transaction({
      createdBy: actorId,
      group: { defaultCurrency: "INR", members: [{ role: "MEMBER" }] },
      groupId: "group-1",
      payments: [{ amountMinor: 1000, payerId: actorId }],
      shares: [
        { owedMinor: 500, participantId: actorId, splitMethod: "EXACT" },
        { owedMinor: 500, participantId: memberId, splitMethod: "EXACT" },
      ],
      totalMinor: 1000,
      updatedAt: new Date(version),
    });

    await expect(updateExpense(database(tx) as never, "expense-1", actorId, input, version)).resolves.toEqual({ expenseId: "expense-1", groupId: "group-1" });
    expect(tx.expense.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ totalMinor: 1000 }),
      where: { deletedAt: null, id: "expense-1", updatedAt: new Date(version) },
    }));
    expect(tx.expensePayment.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.expensePayment.createMany.mock.invocationCallOrder[0]);
    expect(tx.expenseShare.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(tx.expenseShare.createMany.mock.invocationCallOrder[0]);
    expect(tx.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "EXPENSE_UPDATED" }) }));
  });

  it("allows an owner and rejects an unrelated member", async () => {
    const existing = {
      groupId: "group-1",
      payments: [{ amountMinor: 1000, payerId: actorId }],
      shares: [
        { owedMinor: 500, participantId: actorId, splitMethod: "EXACT" },
        { owedMinor: 500, participantId: memberId, splitMethod: "EXACT" },
      ],
      totalMinor: 1000,
      updatedAt: new Date(version),
    };
    const ownerTx = transaction({ createdBy: "someone-else", group: { defaultCurrency: "INR", members: [{ role: "OWNER" }] }, ...existing });
    await expect(updateExpense(database(ownerTx) as never, "expense-1", actorId, input, version)).resolves.toBeDefined();

    const memberTx = transaction({ createdBy: "someone-else", group: { defaultCurrency: "INR", members: [{ role: "MEMBER" }] }, ...existing });
    await expect(updateExpense(database(memberTx) as never, "expense-1", actorId, input, version)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(memberTx.expense.updateMany).not.toHaveBeenCalled();
  });

  it("soft deletes without removing historical ledger rows", async () => {
    const tx = transaction({ createdBy: actorId, description: "Dinner", group: { defaultCurrency: "INR", members: [{ role: "MEMBER" }] }, groupId: "group-1", updatedAt: new Date(version) });

    await expect(deleteExpense(database(tx) as never, "expense-1", actorId, version)).resolves.toEqual({ groupId: "group-1" });
    expect(tx.expense.updateMany).toHaveBeenCalledWith({
      where: { deletedAt: null, id: "expense-1", updatedAt: new Date(version) },
      data: { deletedAt: expect.any(Date) },
    });
    expect(tx.expensePayment.deleteMany).not.toHaveBeenCalled();
    expect(tx.expenseShare.deleteMany).not.toHaveBeenCalled();
    expect(tx.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "EXPENSE_DELETED" }) }));
  });

  it("propagates mutation failures for transaction rollback", async () => {
    const tx = transaction({
      createdBy: actorId,
      group: { defaultCurrency: "INR", members: [{ role: "MEMBER" }] },
      groupId: "group-1",
      payments: [{ amountMinor: 1000, payerId: actorId }],
      shares: [
        { owedMinor: 500, participantId: actorId, splitMethod: "EXACT" },
        { owedMinor: 500, participantId: memberId, splitMethod: "EXACT" },
      ],
      totalMinor: 1000,
      updatedAt: new Date(version),
    });
    tx.expenseShare.createMany.mockRejectedValue(new Error("write failed"));
    await expect(updateExpense(database(tx) as never, "expense-1", actorId, input, version)).rejects.toThrow("write failed");
    expect(tx.activityEvent.create).not.toHaveBeenCalled();
  });

  it("rejects an update that does not use the group currency", async () => {
    const tx = transaction({
      createdBy: actorId,
      group: { defaultCurrency: "INR", members: [{ role: "MEMBER" }] },
      groupId: "group-1",
      payments: [{ amountMinor: 1000, payerId: actorId }],
      shares: [
        { owedMinor: 500, participantId: actorId, splitMethod: "EXACT" },
        { owedMinor: 500, participantId: memberId, splitMethod: "EXACT" },
      ],
      totalMinor: 1000,
      updatedAt: new Date(version),
    });

    await expect(updateExpense(
      database(tx) as never,
      "expense-1",
      actorId,
      { ...input, currency: "USD" },
      version,
    )).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(tx.expense.updateMany).not.toHaveBeenCalled();
  });

  it("rejects stale updates and deletes before writing", async () => {
    const staleVersion = "2026-09-09T09:00:00.000Z";
    const tx = transaction({
      createdBy: actorId,
      description: "Dinner",
      group: { defaultCurrency: "INR", members: [{ role: "MEMBER" }] },
      groupId: "group-1",
      payments: [],
      shares: [],
      totalMinor: 1000,
      updatedAt: new Date(version),
    });

    await expect(updateExpense(database(tx) as never, "expense-1", actorId, input, staleVersion))
      .rejects.toMatchObject({ code: "CONFLICT" });
    await expect(deleteExpense(database(tx) as never, "expense-1", actorId, staleVersion))
      .rejects.toMatchObject({ code: "CONFLICT" });
    expect(tx.expense.updateMany).not.toHaveBeenCalled();
  });

  it("preserves the original split method when financial allocations are unchanged", async () => {
    const tx = transaction({
      createdBy: actorId,
      group: { defaultCurrency: "INR", members: [{ role: "MEMBER" }] },
      groupId: "group-1",
      payments: [{ amountMinor: 1000, payerId: actorId }],
      shares: [
        { owedMinor: 500, participantId: actorId, splitMethod: "PERCENTAGE" },
        { owedMinor: 500, participantId: memberId, splitMethod: "PERCENTAGE" },
      ],
      totalMinor: 1000,
      updatedAt: new Date(version),
    });

    await updateExpense(database(tx) as never, "expense-1", actorId, input, version);

    expect(tx.expenseShare.createMany).toHaveBeenCalledWith({
      data: [
        { expenseId: "expense-1", owedMinor: 500, participantId: actorId, splitMethod: "PERCENTAGE" },
        { expenseId: "expense-1", owedMinor: 500, participantId: memberId, splitMethod: "PERCENTAGE" },
      ],
    });
  });
});
