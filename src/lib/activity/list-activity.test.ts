import { listActivity, parseActivityPage, parseActivityType } from "./list-activity";

function createDatabase({ events = [], groups = [], settlements = [] }: {
  events?: unknown[];
  groups?: unknown[];
  settlements?: unknown[];
} = {}) {
  return {
    activityEvent: { findMany: jest.fn().mockResolvedValue(events) },
    group: { findMany: jest.fn().mockResolvedValue(groups) },
    settlement: { findMany: jest.fn().mockResolvedValue(settlements) },
  };
}

const authorizedGroups = [{ id: "group-1", name: "Flatmates" }];

describe("activity query parsing", () => {
  it("accepts supported filters and normalizes invalid pages", () => {
    expect(parseActivityType("EXPENSE_CREATED")).toBe("EXPENSE_CREATED");
    expect(parseActivityType("NOT_AN_EVENT")).toBeUndefined();
    expect(parseActivityPage("3")).toBe(3);
    expect(parseActivityPage("0")).toBe(1);
    expect(parseActivityPage("1.5")).toBe(1);
  });
});

describe("listActivity", () => {
  it("reads events only from groups the user belongs to", async () => {
    const database = createDatabase({ groups: authorizedGroups });

    await listActivity(database as never, "user-1");

    expect(database.group.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { members: { some: { userId: "user-1" } } },
    }));
    expect(database.activityEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { groupId: { in: ["group-1"] } },
    }));
  });

  it("does not query events for a group the user cannot access", async () => {
    const database = createDatabase({ groups: authorizedGroups });

    const result = await listActivity(database as never, "user-1", { groupId: "group-2" });

    expect(result.error).toEqual({ message: "Group activity could not be found." });
    expect(database.activityEvent.findMany).not.toHaveBeenCalled();
  });

  it("applies activity filters and paginates with a lookahead row", async () => {
    const event = {
      actor: { name: "Alex" },
      createdAt: new Date("2026-09-05T10:30:00.000Z"),
      entityId: "expense-1",
      group: { name: "Flatmates" },
      groupId: "group-1",
      id: "event-1",
      metadata: { currency: "INR", description: "groceries", totalMinor: 240000 },
      type: "EXPENSE_CREATED",
    };
    const database = createDatabase({ events: [event, { ...event, id: "lookahead" }], groups: authorizedGroups });

    const result = await listActivity(database as never, "user-1", {
      groupId: "group-1",
      page: 2,
      type: "EXPENSE_CREATED",
    }, 1);

    expect(database.activityEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 1,
      take: 2,
      where: { groupId: "group-1", type: "EXPENSE_CREATED" },
    }));
    expect(result.hasMore).toBe(true);
    expect(result.items).toEqual([expect.objectContaining({
      description: "Alex added ₹2,400 groceries",
      href: "/expenses/expense-1",
      label: "Expense added",
    })]);
  });

  it("uses settlement relationships for a human-readable event", async () => {
    const database = createDatabase({
      events: [{
        actor: { name: "Alex" },
        createdAt: new Date("2026-09-05T10:30:00.000Z"),
        entityId: "settlement-1",
        group: { name: "Flatmates" },
        groupId: "group-1",
        id: "event-1",
        metadata: {},
        type: "SETTLEMENT_CREATED",
      }],
      groups: authorizedGroups,
      settlements: [{
        amountMinor: 80000,
        currency: "INR",
        id: "settlement-1",
        payee: { name: "Alex" },
        payer: { name: "Priya" },
      }],
    });

    const result = await listActivity(database as never, "user-1");

    expect(result.items[0]?.description).toBe("Priya recorded ₹800 paid to Alex");
    expect(database.settlement.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { groupId: { in: ["group-1"] }, id: { in: ["settlement-1"] } },
    }));
  });

  it("returns a safe error when a query fails", async () => {
    const database = createDatabase();
    database.group.findMany.mockRejectedValue(new Error("database unavailable"));

    await expect(listActivity(database as never, "user-1")).resolves.toEqual({
      error: { message: "Activity could not be loaded." },
      groups: [],
      hasMore: false,
      items: [],
      page: 1,
    });
  });
});
