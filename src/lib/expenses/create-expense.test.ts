import { createExpense, ExpenseCreationError } from "./create-expense";

const actorId = "00000000-0000-4000-8000-000000000001";
const memberId = "00000000-0000-4000-8000-000000000002";

function validExpense() {
  return {
    amount: "10.00", category: "GROCERIES", currency: "INR", date: "2026-09-04",
    description: "Groceries", notes: "For dinner",
    participants: [
      { exactAmount: "", included: true, memberId: actorId, percentage: "", shares: "1" },
      { exactAmount: "", included: true, memberId, percentage: "", shares: "1" },
    ],
    payers: [{ amount: "6", memberId: actorId }, { amount: "4", memberId }],
    splitMethod: "EQUAL",
  };
}

function createTransaction(overrides: Record<string, unknown> = {}) {
  return {
    activityEvent: { create: jest.fn().mockResolvedValue({}) },
    expense: { create: jest.fn().mockResolvedValue({ id: "expense-1" }) },
    expensePayment: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    expenseShare: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
    group: { findFirst: jest.fn(), findUnique: jest.fn().mockResolvedValue({ id: "group-1" }) },
    groupMember: { findMany: jest.fn().mockResolvedValue([{ userId: actorId }, { userId: memberId }]) },
    ...overrides,
  };
}

function createDatabase(transaction = createTransaction()) {
  return {
    database: {
      $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
    },
    transaction,
  };
}

describe("createExpense", () => {
  it("writes the complete ledger and activity event in one transaction", async () => {
    const { database, transaction } = createDatabase();
    await expect(createExpense(database as never, "group-1", actorId, validExpense())).resolves.toEqual({ expenseId: "expense-1" });

    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.expense.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ totalMinor: 1000 }) }));
    expect(transaction.expensePayment.createMany).toHaveBeenCalledWith({ data: [
      { amountMinor: 600, expenseId: "expense-1", payerId: actorId },
      { amountMinor: 400, expenseId: "expense-1", payerId: memberId },
    ] });
    expect(transaction.expenseShare.createMany).toHaveBeenCalledWith({ data: [
      { expenseId: "expense-1", owedMinor: 500, participantId: actorId, splitMethod: "EQUAL" },
      { expenseId: "expense-1", owedMinor: 500, participantId: memberId, splitMethod: "EQUAL" },
    ] });
    expect(transaction.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ entityId: "expense-1", type: "EXPENSE_CREATED" }) }));
  });

  it("rejects invalid input before opening a transaction", async () => {
    const { database } = createDatabase();
    await expect(createExpense(database as never, "group-1", actorId, { nope: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("checks actor and referenced-member authorization inside the transaction", async () => {
    const transaction = createTransaction();
    transaction.groupMember.findMany.mockResolvedValue([{ userId: memberId }]);
    const { database } = createDatabase(transaction);
    await expect(createExpense(database as never, "group-1", actorId, validExpense())).rejects.toEqual(
      new ExpenseCreationError("You do not have permission to add expenses to this group.", "FORBIDDEN"),
    );
    expect(transaction.expense.create).not.toHaveBeenCalled();
  });

  it("propagates a failed write so Prisma can roll back the transaction", async () => {
    const transaction = createTransaction();
    transaction.expenseShare.createMany.mockRejectedValue(new Error("write failed"));
    const { database } = createDatabase(transaction);
    await expect(createExpense(database as never, "group-1", actorId, validExpense())).rejects.toThrow("write failed");
    expect(transaction.activityEvent.create).not.toHaveBeenCalled();
  });
});
