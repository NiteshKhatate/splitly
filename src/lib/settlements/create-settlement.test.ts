import { createSettlement, SettlementError } from "./create-settlement";

const actorId = "00000000-0000-4000-8000-000000000001";
const payeeId = "00000000-0000-4000-8000-000000000002";
const idempotencyKey = "00000000-0000-4000-8000-000000000010";

function validSettlement() {
  return {
    amount: "8.00",
    currency: "INR",
    date: "2026-09-04",
    idempotencyKey,
    note: "Partial payment",
    payeeId,
  };
}

function createTransaction() {
  return {
    activityEvent: { create: jest.fn().mockResolvedValue({}) },
    group: { findUnique: jest.fn().mockResolvedValue({
      defaultCurrency: "INR", members: [{ userId: actorId }, { userId: payeeId }],
    }) },
    settlement: {
      create: jest.fn().mockResolvedValue({ id: "settlement-1" }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
  };
}

function createDatabase(transaction = createTransaction()) {
  return {
    database: {
      $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)),
      settlement: { findUnique: jest.fn() },
    },
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
      amountMinor: 800, createdBy: actorId, currency: "INR", groupId: "group-1",
      idempotencyKey, payeeId, payerId: actorId,
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
    transaction.group.findUnique.mockResolvedValue({ defaultCurrency: "INR", members: [{ userId: payeeId }] });
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

  it("rejects a settlement that does not use the group currency", async () => {
    const input = { ...validSettlement(), currency: "USD" };
    const rejected = createDatabase();
    await expect(createSettlement(rejected.database as never, "group-1", actorId, input)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(rejected.transaction.settlement.create).not.toHaveBeenCalled();
  });

  it("propagates a failed activity write so Prisma can roll back the settlement", async () => {
    const transaction = createTransaction();
    transaction.activityEvent.create.mockRejectedValue(new Error("write failed"));
    const { database } = createDatabase(transaction);
    await expect(createSettlement(database as never, "group-1", actorId, validSettlement())).rejects.toThrow("write failed");
  });

  it("returns the existing settlement for an identical retry", async () => {
    const transaction = createTransaction();
    transaction.settlement.findUnique.mockResolvedValue({
      amountMinor: 800,
      createdBy: actorId,
      currency: "INR",
      date: new Date("2026-09-04T00:00:00.000Z"),
      groupId: "group-1",
      id: "settlement-existing",
      note: "Partial payment",
      payeeId,
      payerId: actorId,
    });
    const { database } = createDatabase(transaction);

    await expect(createSettlement(database as never, "group-1", actorId, validSettlement()))
      .resolves.toEqual({ groupId: "group-1", settlementId: "settlement-existing" });
    expect(transaction.settlement.create).not.toHaveBeenCalled();
    expect(transaction.activityEvent.create).not.toHaveBeenCalled();
  });

  it("rejects reuse of an idempotency key for a different payload", async () => {
    const transaction = createTransaction();
    transaction.settlement.findUnique.mockResolvedValue({
      amountMinor: 900,
      createdBy: actorId,
      currency: "INR",
      date: new Date("2026-09-04T00:00:00.000Z"),
      groupId: "group-1",
      id: "settlement-existing",
      note: "Different",
      payeeId,
      payerId: actorId,
    });
    const { database } = createDatabase(transaction);

    await expect(createSettlement(database as never, "group-1", actorId, validSettlement()))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(transaction.settlement.create).not.toHaveBeenCalled();
  });
});
