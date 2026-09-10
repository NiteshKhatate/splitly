import { deleteGroup, updateGroup } from "./manage-group";

function transaction(group: unknown) {
  return {
    group: {
      delete: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(group),
      update: jest.fn().mockResolvedValue({ id: "group-1", name: "Home" }),
    },
  };
}

function database(tx: ReturnType<typeof transaction>) {
  return { $transaction: jest.fn(async (callback: (value: typeof tx) => unknown) => callback(tx)) };
}

describe("group management", () => {
  it("allows an admin to update a group", async () => {
    const tx = transaction({ id: "group-1", members: [{ role: "OWNER" }] });

    await expect(updateGroup(database(tx) as never, "group-1", "user-1", {
      description: "Shared home costs",
      name: "Home",
    })).resolves.toEqual({ groupId: "group-1", name: "Home" });
    expect(tx.group.update).toHaveBeenCalledWith({
      data: { description: "Shared home costs", name: "Home" },
      select: { id: true, name: true },
      where: { id: "group-1" },
    });
  });

  it("rejects a non-admin update", async () => {
    const tx = transaction({ id: "group-1", members: [{ role: "MEMBER" }] });

    await expect(updateGroup(database(tx) as never, "group-1", "user-1", {
      description: "",
      name: "Home",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(tx.group.update).not.toHaveBeenCalled();
  });

  it("allows an admin to delete a group transactionally", async () => {
    const tx = transaction({ id: "group-1", members: [{ role: "OWNER" }] });

    await expect(deleteGroup(database(tx) as never, "group-1", "user-1"))
      .resolves.toEqual({ groupId: "group-1" });
    expect(tx.group.delete).toHaveBeenCalledWith({ where: { id: "group-1" } });
  });

  it("rejects a non-admin delete", async () => {
    const tx = transaction({ id: "group-1", members: [{ role: "MEMBER" }] });

    await expect(deleteGroup(database(tx) as never, "group-1", "user-1"))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(tx.group.delete).not.toHaveBeenCalled();
  });
});
