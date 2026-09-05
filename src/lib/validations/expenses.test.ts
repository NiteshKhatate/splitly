import { expenseFiltersSchema, expenseFormSchema, parseDecimalToMinor } from "./expenses";

const memberA = "00000000-0000-4000-8000-000000000001";
const memberB = "00000000-0000-4000-8000-000000000002";

function validExpense() {
  return {
    amount: "10.00",
    category: "GROCERIES",
    currency: "INR",
    date: "2026-09-04",
    description: "Groceries",
    notes: "",
    participants: [
      { exactAmount: "5", included: true, memberId: memberA, percentage: "50", shares: "1" },
      { exactAmount: "5", included: true, memberId: memberB, percentage: "50", shares: "1" },
    ],
    payers: [
      { amount: "10", memberId: memberA },
      { amount: "", memberId: memberB },
    ],
    splitMethod: "EQUAL",
  };
}

describe("expense validation", () => {
  it.each([["10", 1000], ["10.5", 1050], ["10.05", 1005], ["0.01", 1]])(
    "parses %s into integer minor units",
    (value, expected) => expect(parseDecimalToMinor(value)).toBe(expected),
  );

  it("accepts a valid expense", () => {
    expect(expenseFormSchema.safeParse(validExpense()).success).toBe(true);
  });

  it("rejects payer totals that do not reconcile", () => {
    const expense = validExpense();
    expense.payers[0].amount = "9.99";
    expect(expenseFormSchema.safeParse(expense).error?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Payer amounts must equal the expense total." })]),
    );
  });

  it("validates exact, percentage, and shares configurations", () => {
    const exact = validExpense();
    exact.splitMethod = "EXACT";
    exact.participants[1].exactAmount = "4.99";
    expect(expenseFormSchema.safeParse(exact).success).toBe(false);

    const percentage = validExpense();
    percentage.splitMethod = "PERCENTAGE";
    percentage.participants[1].percentage = "49.99";
    expect(expenseFormSchema.safeParse(percentage).success).toBe(false);

    const shares = validExpense();
    shares.splitMethod = "SHARES";
    shares.participants[1].shares = "0";
    expect(expenseFormSchema.safeParse(shares).success).toBe(false);
  });

  it("rejects missing participants, invalid dates, and non-ISO currencies", () => {
    const expense = validExpense();
    expense.participants.forEach((participant) => { participant.included = false; });
    expense.date = "tomorrow";
    expense.currency = "rupees";
    expect(expenseFormSchema.safeParse(expense).success).toBe(false);
  });

  it("rejects amounts that exceed the PostgreSQL integer range", () => {
    const expense = validExpense();
    expense.amount = "21474836.48";
    expect(expenseFormSchema.safeParse(expense).error?.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Amount is too large." })]),
    );
  });

  it("rejects duplicate payer and participant IDs", () => {
    const expense = validExpense();
    expense.payers[1].memberId = memberA;
    expense.participants[1].memberId = memberA;
    const result = expenseFormSchema.safeParse(expense);
    expect(result.error?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ message: "Each payer can appear only once." }),
      expect.objectContaining({ message: "Each participant can appear only once." }),
    ]));
  });
});

describe("expense filter validation", () => {
  it("accepts supported filters", () => {
    expect(expenseFiltersSchema.safeParse({
      category: "DINING",
      from: "2026-09-01",
      memberId: memberA,
      search: "dinner",
      to: "2026-09-30",
    }).success).toBe(true);
  });

  it("rejects reversed dates and invalid filter values", () => {
    expect(expenseFiltersSchema.safeParse({ from: "2026-09-30", to: "2026-09-01" }).success).toBe(false);
    expect(expenseFiltersSchema.safeParse({ category: "INVALID" }).success).toBe(false);
    expect(expenseFiltersSchema.safeParse({ memberId: "not-a-uuid" }).success).toBe(false);
  });
});
