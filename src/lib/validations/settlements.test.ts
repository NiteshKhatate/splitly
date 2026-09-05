import { SETTLEMENT_NOTE_MAX_LENGTH, settlementFormSchema } from "./settlements";

const payeeId = "00000000-0000-4000-8000-000000000002";

function validSettlement() {
  return {
    amount: "10.25",
    currency: "INR",
    date: "2026-09-04",
    note: "Paid by bank transfer",
    payeeId,
  };
}

describe("settlementFormSchema", () => {
  it("accepts and trims a valid settlement", () => {
    expect(settlementFormSchema.parse({ ...validSettlement(), amount: " 10.25 ", note: " paid " })).toMatchObject({
      amount: "10.25",
      note: "paid",
    });
  });

  it.each(["", "0", "-1", "1.001", "not-money"])("rejects invalid amount %p", (amount) => {
    expect(settlementFormSchema.safeParse({ ...validSettlement(), amount }).success).toBe(false);
  });

  it("requires a valid recipient, ISO currency, and date", () => {
    const result = settlementFormSchema.safeParse({
      ...validSettlement(), currency: "inr", date: "04/09/2026", payeeId: "not-a-user",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map(({ path }) => path[0])).toEqual(expect.arrayContaining(["currency", "date", "payeeId"]));
    }
  });

  it("limits optional notes", () => {
    expect(settlementFormSchema.safeParse({ ...validSettlement(), note: "x".repeat(SETTLEMENT_NOTE_MAX_LENGTH + 1) }).success).toBe(false);
  });
});
