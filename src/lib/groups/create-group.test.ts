import { createGroup } from "./create-group";

const input = {
  createdBy: "00000000-0000-4000-8000-000000000001",
  defaultCurrency: "INR",
  description: "Shared home costs",
  id: "00000000-0000-4000-8000-000000000010",
  name: "Flatmates",
};

function createDatabase({ membershipFails = false } = {}) {
  const transaction = {
    group: {
      create: jest.fn().mockResolvedValue({ id: input.id }),
    },
    groupMember: {
      create: membershipFails
        ? jest.fn().mockRejectedValue(new Error("membership failed"))
        : jest.fn().mockResolvedValue({}),
    },
  };
  const database = {
    $transaction: jest.fn(async (callback: (value: typeof transaction) => unknown) => callback(transaction)),
  };
  return { database, transaction };
}

describe("createGroup", () => {
  it("creates the group and owner membership in one transaction", async () => {
    const { database, transaction } = createDatabase();

    await expect(createGroup(database as never, input)).resolves.toEqual({ groupId: input.id });
    expect(database.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.group.create).toHaveBeenCalledWith({
      data: input,
      select: { id: true },
    });
    expect(transaction.groupMember.create).toHaveBeenCalledWith({
      data: { groupId: input.id, role: "OWNER", userId: input.createdBy },
    });
  });

  it("propagates membership failure so the database transaction rolls back", async () => {
    const { database } = createDatabase({ membershipFails: true });

    await expect(createGroup(database as never, input)).rejects.toThrow("membership failed");
  });
});
