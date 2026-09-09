import type { PrismaClient } from "@prisma/client";

export type MaintenanceDatabase = Pick<PrismaClient, "attachment" | "rateLimitBucket">;

export async function cleanupDeletedAttachments(
  database: MaintenanceDatabase,
  removeObjects: (keys: string[]) => Promise<{ error: unknown | null }>,
): Promise<{ cleaned: number; pending: number }> {
  const pending = await database.attachment.findMany({
    orderBy: { deletedAt: "asc" },
    select: { id: true, storageKey: true },
    take: 100,
    where: { deletedAt: { not: null } },
  });
  if (pending.length === 0) return { cleaned: 0, pending: 0 };

  const removal = await removeObjects(pending.map(({ storageKey }) => storageKey));
  if (removal.error) return { cleaned: 0, pending: pending.length };

  const deleted = await database.attachment.deleteMany({
    where: { id: { in: pending.map(({ id }) => id) } },
  });
  return { cleaned: deleted.count, pending: pending.length - deleted.count };
}

export async function cleanupExpiredRateLimitBuckets(
  database: MaintenanceDatabase,
  cutoff: Date,
): Promise<number> {
  if (Number.isNaN(cutoff.getTime())) throw new Error("A valid cleanup cutoff is required.");
  const deleted = await database.rateLimitBucket.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  return deleted.count;
}
