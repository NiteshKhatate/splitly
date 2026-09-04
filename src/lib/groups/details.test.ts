import { getCurrentUserGroupBalances } from "@/lib/balances/group-balances";

import { getGroupDetail } from "./details";

jest.mock("@/lib/balances/group-balances", () => {
  const actual = jest.requireActual("@/lib/balances/group-balances");

  return {
    ...actual,
    getCurrentUserGroupBalances: jest.fn(),
  };
});

function createQueryResult<T>(data: T, error: { message: string } | null = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    returns: jest.fn().mockResolvedValue({ data, error }),
  };
}

describe("getGroupDetail", () => {
  beforeEach(() => {
    jest.mocked(getCurrentUserGroupBalances).mockReset();
  });

  it("returns a not-found error when the group does not exist", async () => {
    const groupQuery = createQueryResult(null);
    const supabase = {
      from: jest.fn(() => groupQuery),
    };

    const database = { expense: { findMany: jest.fn() } };
    const result = await getGroupDetail(
      supabase as never,
      database as never,
      "missing-group",
      "user-1",
    );

    expect(result).toEqual({ group: null, error: { message: "Group not found." } });
    expect(getCurrentUserGroupBalances).not.toHaveBeenCalled();
  });

  it("maps group detail, members, recent expenses, and current user permissions", async () => {
    const groupQuery = createQueryResult({
      id: "group-1",
      name: "Goa trip",
      description: "September trip",
      currency: null,
      created_by: "user-1",
    });
    const membersQuery = createQueryResult([
      {
        id: "member-1",
        role: "admin",
        user_id: "user-1",
        profiles: { id: "user-1", full_name: " Ada Lovelace ", email: "ada@example.com", avatar_url: null },
      },
      {
        id: "member-2",
        role: "member",
        user_id: "user-2",
        profiles: [{ id: "user-2", full_name: null, email: "grace@example.com", avatar_url: "avatar.png" }],
      },
    ]);
    const database = {
      expense: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "expense-1",
            description: "Dinner",
            totalMinor: 12550,
            date: new Date("2026-09-04T00:00:00.000Z"),
          },
          {
            id: "expense-2",
            description: "Taxi",
            totalMinor: 8000,
            date: new Date("2026-09-03T00:00:00.000Z"),
          },
        ]),
      },
    };
    jest.mocked(getCurrentUserGroupBalances).mockResolvedValue({
      balances: new Map([[
        "group-1",
        {
          amountInMinorUnits: 12550,
          label: "You are owed ₹125.5",
          tone: "success",
        },
      ]]),
      error: null,
    });
    const supabase = {
      from: jest.fn()
        .mockReturnValueOnce(groupQuery)
        .mockReturnValueOnce(membersQuery),
    };

    const result = await getGroupDetail(
      supabase as never,
      database as never,
      "group-1",
      "user-1",
    );

    expect(result.error).toBeNull();
    expect(result.group).toMatchObject({
      id: "group-1",
      name: "Goa trip",
      description: "September trip",
      currency: "INR",
      memberCount: 2,
      currentUserRole: "admin",
      canAddMembers: true,
      balances: {
        youOwe: { amount: "₹0", tone: "neutral" },
        youAreOwed: { amount: "₹125.5", tone: "success" },
        net: {
          amount: "+₹125.5",
          tone: "success",
          description: "Overall, you're owed money",
        },
      },
      members: [
        {
          id: "member-1",
          userId: "user-1",
          name: "Ada Lovelace",
          email: "ada@example.com",
          avatarUrl: null,
          role: "admin",
          isCurrentUser: true,
        },
        {
          id: "member-2",
          userId: "user-2",
          name: "grace",
          email: "grace@example.com",
          avatarUrl: "avatar.png",
          role: "member",
          isCurrentUser: false,
        },
      ],
      recentExpenses: [
        { id: "expense-1", description: "Dinner", amount: "₹125.5", date: "4 Sept" },
        { id: "expense-2", description: "Taxi", amount: "₹80", date: "3 Sept" },
      ],
    });
    expect(database.expense.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null, groupId: "group-1" },
      orderBy: { date: "desc" },
      take: 5,
      select: {
        date: true,
        description: true,
        id: true,
        totalMinor: true,
      },
    });
    expect(getCurrentUserGroupBalances).toHaveBeenCalledWith(
      database,
      "user-1",
      ["group-1"],
    );
  });

  it("returns balance errors before mapping group details", async () => {
    const groupQuery = createQueryResult({
      id: "group-1",
      name: "Goa trip",
      description: null,
      currency: "INR",
      created_by: "user-1",
    });
    const membersQuery = createQueryResult([]);
    const database = {
      expense: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const error = { message: "balances unavailable" };
    jest.mocked(getCurrentUserGroupBalances).mockResolvedValue({
      balances: new Map(),
      error,
    });
    const supabase = {
      from: jest.fn()
        .mockReturnValueOnce(groupQuery)
        .mockReturnValueOnce(membersQuery),
    };

    const result = await getGroupDetail(
      supabase as never,
      database as never,
      "group-1",
      "user-1",
    );

    expect(result).toEqual({ group: null, error });
  });

  it("returns a safe error when recent expenses cannot be loaded", async () => {
    const groupQuery = createQueryResult({
      id: "group-1",
      name: "Goa trip",
      description: null,
      currency: "INR",
      created_by: "user-1",
    });
    const membersQuery = createQueryResult([]);
    const database = {
      expense: { findMany: jest.fn().mockRejectedValue(new Error("ledger unavailable")) },
    };
    jest.mocked(getCurrentUserGroupBalances).mockResolvedValue({
      balances: new Map(),
      error: null,
    });
    const supabase = {
      from: jest.fn()
        .mockReturnValueOnce(groupQuery)
        .mockReturnValueOnce(membersQuery),
    };

    const result = await getGroupDetail(
      supabase as never,
      database as never,
      "group-1",
      "user-1",
    );

    expect(result).toEqual({
      group: null,
      error: { message: "Group details could not be loaded." },
    });
  });
});
