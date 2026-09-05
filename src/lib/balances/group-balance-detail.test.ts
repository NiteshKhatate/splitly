import { getGroupBalanceDetail } from "./group-balance-detail";

const alexId = "00000000-0000-4000-8000-000000000001";
const samId = "00000000-0000-4000-8000-000000000002";

function createDatabase(group: unknown) {
  return { group: { findFirst: jest.fn().mockResolvedValue(group) } };
}

describe("getGroupBalanceDetail", () => {
  it("authorizes through membership and returns raw balances, transfers, and history", async () => {
    const database = createDatabase({
      defaultCurrency: "INR",
      expenses: [{
        currency: "INR",
        payments: [{ amountMinor: 2400, payerId: alexId }],
        shares: [{ owedMinor: 1200, participantId: alexId }, { owedMinor: 1200, participantId: samId }],
        totalMinor: 2400,
      }],
      id: "group-1",
      members: [{ user: { id: alexId, name: "Alex" } }, { user: { id: samId, name: "Sam" } }],
      name: "Flatmates",
      settlements: [{
        amountMinor: 400, currency: "INR", date: new Date("2026-09-04T00:00:00.000Z"), id: "settlement-1",
        note: "Partial", payee: { id: alexId, name: "Alex" }, payer: { id: samId, name: "Sam" },
      }],
    });

    const result = await getGroupBalanceDetail(database as never, "group-1", alexId);

    expect(database.group.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "group-1", members: { some: { userId: alexId } } },
    }));
    expect(result.error).toBeNull();
    expect(result.detail?.currencies[0].members).toEqual([
      expect.objectContaining({ memberId: alexId, netMinor: 800, status: "is owed" }),
      expect.objectContaining({ memberId: samId, netMinor: -800, status: "owes" }),
    ]);
    expect(result.detail?.currencies[0].transfers).toEqual([
      expect.objectContaining({ amountMinor: 800, payeeId: alexId, payerId: samId }),
    ]);
    expect(result.detail?.settlements[0]).toMatchObject({ id: "settlement-1", note: "Partial" });
  });

  it("returns not found for a group outside the user's memberships", async () => {
    await expect(getGroupBalanceDetail(createDatabase(null) as never, "group-1", alexId)).resolves.toEqual({
      detail: null, error: { message: "Group not found." },
    });
  });

  it("returns a safe error when the ledger is inconsistent or unavailable", async () => {
    const database = createDatabase({
      defaultCurrency: "INR", expenses: [], id: "group-1", members: [], name: "Broken", settlements: [],
    });
    await expect(getGroupBalanceDetail(database as never, "group-1", alexId)).resolves.toEqual({
      detail: null, error: { message: "Group balances could not be loaded." },
    });
  });
});
