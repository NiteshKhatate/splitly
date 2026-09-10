import type { PrismaClient } from "@prisma/client";

import { updateGroupFormSchema } from "@/lib/validations/groups";

export type GroupMutationDatabase = Pick<PrismaClient, "$transaction">;

export class GroupMutationError extends Error {
  constructor(
    message: string,
    public readonly code: "FORBIDDEN" | "INVALID_INPUT" | "NOT_FOUND",
  ) {
    super(message);
    this.name = "GroupMutationError";
  }
}

function requireAdmin(
  group: { id: string; members: { role: string }[] } | null,
) {
  if (!group) {
    throw new GroupMutationError("Group not found.", "NOT_FOUND");
  }

  if (group.members[0]?.role !== "OWNER") {
    throw new GroupMutationError("You do not have permission to manage this group.", "FORBIDDEN");
  }
}

export async function updateGroup(
  database: GroupMutationDatabase,
  groupId: string,
  actorId: string,
  input: unknown,
) {
  return database.$transaction(async (transaction) => {
    const group = await transaction.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        members: {
          where: { userId: actorId },
          select: { role: true },
        },
      },
    });
    requireAdmin(group);
    const validation = updateGroupFormSchema.safeParse(input);
    if (!validation.success) {
      throw new GroupMutationError("Check the group details and try again.", "INVALID_INPUT");
    }

    const updated = await transaction.group.update({
      where: { id: groupId },
      data: {
        description: validation.data.description || null,
        name: validation.data.name,
      },
      select: { id: true, name: true },
    });

    return { groupId: updated.id, name: updated.name };
  });
}

export async function deleteGroup(
  database: GroupMutationDatabase,
  groupId: string,
  actorId: string,
) {
  return database.$transaction(async (transaction) => {
    const group = await transaction.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        members: {
          where: { userId: actorId },
          select: { role: true },
        },
      },
    });
    requireAdmin(group);

    await transaction.group.delete({ where: { id: groupId } });
    return { groupId };
  });
}
