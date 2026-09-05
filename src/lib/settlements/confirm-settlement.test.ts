import { confirmSettlement } from "./confirm-settlement";

const recipientId = "00000000-0000-4000-8000-000000000002";

function createTransaction(settlement: { id: string; payeeId: string; status: "PENDING" | "CONFIRMED" } | null) {
  return {
    activityEvent: { create: jest.fn().mockResolvedValue({}) },
    settlement: {
      findFirst: jest.fn().mockResolvedValue(settlement),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
}

function createDatabase(transaction: ReturnType<typeof createTransaction>) {
  return { $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction)) };
}

describe("confirmSettlement", () => {
  it("lets only the recipient confirm and records the audit event atomically", async () => {
    const transaction = createTransaction({ id: "settlement-1", payeeId: recipientId, status: "PENDING" });
    const database = createDatabase(transaction);

    await expect(confirmSettlement(database as never, "group-1", "settlement-1", recipientId)).resolves.toEqual({
      groupId: "group-1", settlementId: "settlement-1", status: "CONFIRMED",
    });
    expect(transaction.settlement.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "CONFIRMED", confirmedAt: expect.any(Date) }),
      where: { id: "settlement-1", payeeId: recipientId, status: "PENDING" },
    }));
    expect(transaction.activityEvent.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ actorId: recipientId, type: "SETTLEMENT_CONFIRMED" }),
    }));
  });

  it("rejects confirmation by anyone other than the recipient", async () => {
    const transaction = createTransaction({ id: "settlement-1", payeeId: recipientId, status: "PENDING" });
    await expect(confirmSettlement(
      createDatabase(transaction) as never,
      "group-1",
      "settlement-1",
      "00000000-0000-4000-8000-000000000003",
    )).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(transaction.settlement.updateMany).not.toHaveBeenCalled();
  });

  it("is idempotent when the settlement is already confirmed", async () => {
    const transaction = createTransaction({ id: "settlement-1", payeeId: recipientId, status: "CONFIRMED" });
    await confirmSettlement(createDatabase(transaction) as never, "group-1", "settlement-1", recipientId);
    expect(transaction.settlement.updateMany).not.toHaveBeenCalled();
    expect(transaction.activityEvent.create).not.toHaveBeenCalled();
  });
});
