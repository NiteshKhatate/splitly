import { createSettlement, SettlementError } from "./create-settlement";

const actorId = "00000000-0000-4000-8000-000000000001";
const payeeId = "00000000-0000-4000-8000-000000000002";

function validSettlement() {
  return { amount: "8.00", currency: "INR", date: "2026-09-04", note: "Partial payment", payeeId };
}

function createTransaction() {
  return {
    activityEvent: { create: jest.fn().mockResolvedValue({}) },
    group: { findUnique: jest.fn().mockResolvedValue({
      defaultCurrency: "INR", expenses: [], members: [{ userId: actorId }, { userId: payeeId }],
    }) },
    settlement: { create: jest.fn().mockResolvedValue({ id: "settlement-1" }) },
  };
}

function createDatabase(transaction = createTransaction()) {
  return {
    database: { $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)) },
    transaction,
  };
}

describe("createSettlement", () => {
  it("writes a minor-unit settlement and activity event in one transaction", async () => {
    const { database, transaction } = createDatabase();

    await expect(createSettlement(database as never, "group-1", actorId, validSettlement())).resolves.toEqual({
      groupId: "group-1", settlementId: "settlement-1",
    });
    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.settlement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      amountMinor: 800, createdBy: actorId, currency: "INR", groupId: "group-1", payeeId, payerId: actorId,
      status: "PENDING",
    }) }));
    expect(transaction.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({
      entityId: "settlement-1", type: "SETTLEMENT_CREATED",
    }) }));
  });

  it("rejects invalid input before opening a transaction", async () => {
    const { database } = createDatabase();
    await expect(createSettlement(database as never, "group-1", actorId, { nope: true })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(database.$transaction).not.toHaveBeenCalled();
  });

  it("requires the actor, payer, and recipient to be active group members", async () => {
    const transaction = createTransaction();
    transaction.group.findUnique.mockResolvedValue({ defaultCurrency: "INR", expenses: [], members: [{ userId: payeeId }] });
    const { database } = createDatabase(transaction);

    await expect(createSettlement(database as never, "group-1", actorId, validSettlement())).rejects.toEqual(
      new SettlementError("You are not a member of this group.", "FORBIDDEN"),
    );
    expect(transaction.settlement.create).not.toHaveBeenCalled();
  });

  it("always records the authenticated actor as payer", async () => {
    const { database, transaction } = createDatabase();
    await createSettlement(database as never, "group-1", actorId, { ...validSettlement(), payerId: payeeId });
    expect(transaction.settlement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ payerId: actorId, status: "PENDING" }),
    }));
  });

  it("permits ledger currencies and rejects unrelated currencies", async () => {
    const input = { ...validSettlement(), currency: "USD" };
    const rejected = createDatabase();
    await expect(createSettlement(rejected.database as never, "group-1", actorId, input)).rejects.toMatchObject({ code: "INVALID_INPUT" });

    const transaction = createTransaction();
    transaction.group.findUnique.mockResolvedValue({
      defaultCurrency: "INR", expenses: [{ id: "expense-1" }], members: [{ userId: actorId }, { userId: payeeId }],
    });
    const accepted = createDatabase(transaction);
    await expect(createSettlement(accepted.database as never, "group-1", actorId, input)).resolves.toMatchObject({ settlementId: "settlement-1" });
  });

  it("propagates a failed activity write so Prisma can roll back the settlement", async () => {
    const transaction = createTransaction();
    transaction.activityEvent.create.mockRejectedValue(new Error("write failed"));
    const { database } = createDatabase(transaction);
    await expect(createSettlement(database as never, "group-1", actorId, validSettlement())).rejects.toThrow("write failed");
  });
});
