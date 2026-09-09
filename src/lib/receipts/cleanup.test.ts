import { cleanupDeletedAttachments, cleanupExpiredRateLimitBuckets } from "./cleanup";

function database(pending: { id: string; storageKey: string }[]) {
  return {
    attachment: {
      deleteMany: jest.fn().mockResolvedValue({ count: pending.length }),
      findMany: jest.fn().mockResolvedValue(pending),
    },
    rateLimitBucket: {
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };
}

describe("cleanupDeletedAttachments", () => {
  it("removes tombstoned objects before deleting their metadata", async () => {
    const db = database([
      { id: "attachment-1", storageKey: "group/expense/receipt.pdf" },
    ]);
    const remove = jest.fn().mockResolvedValue({ error: null });

    await expect(cleanupDeletedAttachments(db as never, remove)).resolves.toEqual({
      cleaned: 1,
      pending: 0,
    });
    expect(remove).toHaveBeenCalledWith(["group/expense/receipt.pdf"]);
    expect(db.attachment.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["attachment-1"] } },
    });
  });

  it("retains tombstones when storage cleanup fails", async () => {
    const db = database([
      { id: "attachment-1", storageKey: "group/expense/receipt.pdf" },
    ]);
    const remove = jest.fn().mockResolvedValue({ error: new Error("storage unavailable") });

    await expect(cleanupDeletedAttachments(db as never, remove)).resolves.toEqual({
      cleaned: 0,
      pending: 1,
    });
    expect(db.attachment.deleteMany).not.toHaveBeenCalled();
  });
});

describe("cleanupExpiredRateLimitBuckets", () => {
  it("deletes only buckets older than the supplied deterministic cutoff", async () => {
    const db = database([]);
    const cutoff = new Date("2026-08-10T00:00:00.000Z");

    await expect(cleanupExpiredRateLimitBuckets(db as never, cutoff)).resolves.toBe(2);
    expect(db.rateLimitBucket.deleteMany).toHaveBeenCalledWith({
      where: { windowStart: { lt: cutoff } },
    });
  });

  it("rejects an invalid cutoff", async () => {
    await expect(cleanupExpiredRateLimitBuckets(database([]) as never, new Date("invalid")))
      .rejects.toThrow("A valid cleanup cutoff is required.");
  });
});
