import type { PrismaClient } from "@prisma/client";

export type GroupCreationDatabase = Pick<PrismaClient, "$transaction">;

export async function createGroup(
  database: GroupCreationDatabase,
  input: {
    createdBy: string;
    defaultCurrency: string;
    description: string | null;
    id: string;
    name: string;
  },
): Promise<{ groupId: string }> {
  return database.$transaction(async (transaction) => {
    const group = await transaction.group.create({
      data: {
        createdBy: input.createdBy,
        defaultCurrency: input.defaultCurrency,
        description: input.description,
        id: input.id,
        name: input.name,
      },
      select: { id: true },
    });

    await transaction.groupMember.create({
      data: {
        groupId: group.id,
        role: "OWNER",
        userId: input.createdBy,
      },
    });

    return { groupId: group.id };
  });
}
