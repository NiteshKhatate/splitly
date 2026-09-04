import { getCurrentUserGroupBalances } from "@/lib/balances/group-balances";

import { getDashboardGroups } from "./dashboard";

jest.mock("@/lib/balances/group-balances", () => ({
  getCurrentUserGroupBalances: jest.fn(),
}));

function createQueryResult<T>(data: T, error: { message: string } | null = null) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    returns: jest.fn().mockResolvedValue({ data, error }),
  };
}

describe("getDashboardGroups", () => {
  const database = {} as never;

  beforeEach(() => {
    jest.mocked(getCurrentUserGroupBalances).mockReset();
  });

  it("returns an empty result when the user has no groups", async () => {
    const membershipsQuery = createQueryResult([]);
    const supabase = {
      from: jest.fn(() => membershipsQuery),
    };

    const result = await getDashboardGroups(supabase as never, database, "user-1");

    expect(result).toEqual({ groups: [], error: null });
    expect(getCurrentUserGroupBalances).not.toHaveBeenCalled();
  });

  it("maps memberships, member counts, and balances into dashboard groups", async () => {
    const membershipsQuery = createQueryResult([
      {
        group_id: "group-1",
        joined_at: "2026-09-04",
        groups: { id: "group-1", name: "Goa trip", currency: "INR" },
      },
      {
        group_id: "group-2",
        joined_at: "2026-09-03",
        groups: [{ id: "group-2", name: "Flatmates", currency: "INR" }],
      },
    ]);
    const memberRowsQuery = createQueryResult([
      { group_id: "group-1" },
      { group_id: "group-1" },
      { group_id: "group-2" },
    ]);
    const balance = {
      amountInMinorUnits: 2500,
      label: "You are owed ₹25",
      tone: "success" as const,
    };
    jest.mocked(getCurrentUserGroupBalances).mockResolvedValue({
      balances: new Map([["group-1", balance]]),
      error: null,
    });
    const supabase = {
      from: jest.fn()
        .mockReturnValueOnce(membershipsQuery)
        .mockReturnValueOnce(memberRowsQuery),
    };

    const result = await getDashboardGroups(supabase as never, database, "user-1", 2);

    expect(result.error).toBeNull();
    expect(result.groups).toEqual([
      {
        id: "group-1",
        name: "Goa trip",
        members: 2,
        balance,
        href: "/groups/group-1",
      },
      {
        id: "group-2",
        name: "Flatmates",
        members: 1,
        balance: {
          amountInMinorUnits: 0,
          label: "Settled up",
          tone: "neutral",
        },
        href: "/groups/group-2",
      },
    ]);
    expect(getCurrentUserGroupBalances).toHaveBeenCalledWith(
      database,
      "user-1",
      ["group-1", "group-2"],
    );
  });

  it("returns member query errors", async () => {
    const membershipsQuery = createQueryResult([
      {
        group_id: "group-1",
        joined_at: "2026-09-04",
        groups: { id: "group-1", name: "Goa trip", currency: "INR" },
      },
    ]);
    const error = { message: "members unavailable" };
    const memberRowsQuery = createQueryResult([], error);
    jest.mocked(getCurrentUserGroupBalances).mockResolvedValue({
      balances: new Map(),
      error: null,
    });
    const supabase = {
      from: jest.fn()
        .mockReturnValueOnce(membershipsQuery)
        .mockReturnValueOnce(memberRowsQuery),
    };

    const result = await getDashboardGroups(supabase as never, database, "user-1");

    expect(result).toEqual({ groups: [], error });
  });
});
