import { deleteGroup, updateGroup } from "./manage-group";

function transaction(group: unknown) {
  return {
    activityEvent: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    attachment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    expense: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    expensePayment: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    expenseShare: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    group: {
      delete: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn().mockResolvedValue(group),
      update: jest.fn().mockResolvedValue({ id: "group-1", name: "Home" }),
    },
    groupMember: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    invite: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    reminderDelivery: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
    settlement: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
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
    const expenseFilter = { where: { expense: { groupId: "group-1" } } };
    expect(tx.attachment.deleteMany).toHaveBeenCalledWith(expenseFilter);
    expect(tx.expensePayment.deleteMany).toHaveBeenCalledWith(expenseFilter);
    expect(tx.expenseShare.deleteMany).toHaveBeenCalledWith(expenseFilter);
    expect(tx.expense.deleteMany).toHaveBeenCalledWith({ where: { groupId: "group-1" } });
    expect(tx.settlement.deleteMany).toHaveBeenCalledWith({ where: { groupId: "group-1" } });
    expect(tx.reminderDelivery.deleteMany).toHaveBeenCalledWith({ where: { groupId: "group-1" } });
    expect(tx.invite.deleteMany).toHaveBeenCalledWith({ where: { groupId: "group-1" } });
    expect(tx.groupMember.deleteMany).toHaveBeenCalledWith({ where: { groupId: "group-1" } });
    expect(tx.activityEvent.deleteMany).toHaveBeenCalledWith({ where: { groupId: "group-1" } });
    expect(tx.group.delete).toHaveBeenCalledWith({ where: { id: "group-1" } });
    expect(tx.attachment.deleteMany.mock.invocationCallOrder[0])
      .toBeLessThan(tx.expense.deleteMany.mock.invocationCallOrder[0] as number);
    expect(tx.groupMember.deleteMany.mock.invocationCallOrder[0])
      .toBeLessThan(tx.activityEvent.deleteMany.mock.invocationCallOrder[0] as number);
    expect(tx.activityEvent.deleteMany.mock.invocationCallOrder[0])
      .toBeLessThan(tx.group.delete.mock.invocationCallOrder[0] as number);
  });

  it("rejects a non-admin delete", async () => {
    const tx = transaction({ id: "group-1", members: [{ role: "MEMBER" }] });

    await expect(deleteGroup(database(tx) as never, "group-1", "user-1"))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(tx.groupMember.deleteMany).not.toHaveBeenCalled();
    expect(tx.group.delete).not.toHaveBeenCalled();
  });
});
