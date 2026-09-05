import { calculateMemberBalances, simplifyDebts } from "./balance-engine";

const members = ["alex", "priya", "sam"];

describe("balance engine", () => {
  it("combines multiple payers, unequal shares, and multiple expenses", () => {
    const result = calculateMemberBalances({
      memberIds: members,
      expenses: [
        {
          currency: "INR",
          payments: [{ memberId: "alex", amountMinor: 600 }, { memberId: "sam", amountMinor: 400 }],
          shares: [{ memberId: "alex", amountMinor: 200 }, { memberId: "priya", amountMinor: 300 }, { memberId: "sam", amountMinor: 500 }],
          totalMinor: 1000,
        },
        {
          currency: "INR",
          payments: [{ memberId: "priya", amountMinor: 300 }],
          shares: [{ memberId: "alex", amountMinor: 100 }, { memberId: "priya", amountMinor: 100 }, { memberId: "sam", amountMinor: 100 }],
          totalMinor: 300,
        },
      ],
      settlements: [],
    });

    expect(result).toEqual([{ currency: "INR", balances: [
      { memberId: "alex", netMinor: 300 },
      { memberId: "priya", netMinor: -100 },
      { memberId: "sam", netMinor: -200 },
    ] }]);
  });

  it("applies partial and multiple settlements without changing expenses", () => {
    const expense = {
      currency: "INR", payments: [{ memberId: "alex", amountMinor: 1000 }],
      shares: [{ memberId: "alex", amountMinor: 0 }, { memberId: "sam", amountMinor: 1000 }], totalMinor: 1000,
    };
    const result = calculateMemberBalances({
      memberIds: ["alex", "sam"], expenses: [expense],
      settlements: [
        { amountMinor: 300, currency: "INR", payeeId: "alex", payerId: "sam" },
        { amountMinor: 200, currency: "INR", payeeId: "alex", payerId: "sam" },
      ],
    });

    expect(result[0].balances).toEqual([
      { memberId: "alex", netMinor: 500 }, { memberId: "sam", netMinor: -500 },
    ]);
    expect(expense).toEqual(expect.objectContaining({ totalMinor: 1000 }));
  });

  it("preserves zero balances and isolates currencies", () => {
    const result = calculateMemberBalances({
      currencies: ["INR", "USD"], memberIds: ["alex", "sam"],
      expenses: [{
        currency: "USD", payments: [{ memberId: "alex", amountMinor: 1 }],
        shares: [{ memberId: "alex", amountMinor: 0 }, { memberId: "sam", amountMinor: 1 }], totalMinor: 1,
      }], settlements: [{ amountMinor: 1, currency: "USD", payeeId: "alex", payerId: "sam" }],
    });

    expect(result).toEqual([
      { currency: "INR", balances: [{ memberId: "alex", netMinor: 0 }, { memberId: "sam", netMinor: 0 }] },
      { currency: "USD", balances: [{ memberId: "alex", netMinor: 0 }, { memberId: "sam", netMinor: 0 }] },
    ]);
  });

  it("rejects invalid membership, amounts, and unreconciled expenses", () => {
    expect(() => calculateMemberBalances({ memberIds: ["alex"], expenses: [{ currency: "INR", payments: [{ memberId: "outsider", amountMinor: 10 }], shares: [{ memberId: "alex", amountMinor: 10 }], totalMinor: 10 }], settlements: [] })).toThrow("Every payer must be a group member.");
    expect(() => calculateMemberBalances({ memberIds: ["alex"], expenses: [{ currency: "INR", payments: [{ memberId: "alex", amountMinor: 9 }], shares: [{ memberId: "alex", amountMinor: 10 }], totalMinor: 10 }], settlements: [] })).toThrow("reconcile");
    expect(() => calculateMemberBalances({ memberIds: ["alex"], expenses: [], settlements: [{ amountMinor: -1, currency: "INR", payeeId: "alex", payerId: "other" }] })).toThrow("safe integers");
  });
});

describe("debt simplification", () => {
  it("deterministically matches sorted debtors and creditors", () => {
    const balances = { currency: "INR", balances: [
      { memberId: "zoe", netMinor: 300 },
      { memberId: "bob", netMinor: -200 },
      { memberId: "amy", netMinor: -500 },
      { memberId: "carl", netMinor: 400 },
    ] };

    expect(simplifyDebts(balances)).toEqual([
      { amountMinor: 400, currency: "INR", payeeId: "carl", payerId: "amy" },
      { amountMinor: 100, currency: "INR", payeeId: "zoe", payerId: "amy" },
      { amountMinor: 200, currency: "INR", payeeId: "zoe", payerId: "bob" },
    ]);
    expect(simplifyDebts({ ...balances, balances: [...balances.balances].reverse() })).toEqual(simplifyDebts(balances));
  });

  it("returns no transfers for settled balances and rejects non-conserving input", () => {
    expect(simplifyDebts({ currency: "INR", balances: members.map((memberId) => ({ memberId, netMinor: 0 })) })).toEqual([]);
    expect(() => simplifyDebts({ currency: "INR", balances: [{ memberId: "alex", netMinor: 1 }] })).toThrow("reconcile");
  });

  it("suggested transfers fully resolve the raw balances", () => {
    const raw = { currency: "INR", balances: [
      { memberId: "alex", netMinor: 501 }, { memberId: "priya", netMinor: -167 }, { memberId: "sam", netMinor: -334 },
    ] };
    const remaining = new Map(raw.balances.map((balance) => [balance.memberId, balance.netMinor]));
    for (const transfer of simplifyDebts(raw)) {
      remaining.set(transfer.payerId, remaining.get(transfer.payerId)! + transfer.amountMinor);
      remaining.set(transfer.payeeId, remaining.get(transfer.payeeId)! - transfer.amountMinor);
    }
    expect(Array.from(remaining.values())).toEqual([0, 0, 0]);
  });
});
