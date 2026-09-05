import { z } from "zod";

export const EXPENSE_DESCRIPTION_MAX_LENGTH = 120;
export const EXPENSE_NOTES_MAX_LENGTH = 500;
export const MAX_EXPENSE_MINOR = 2_147_483_647;
export const EXPENSE_CATEGORIES = [
  "GENERAL", "GROCERIES", "DINING", "TRANSPORT", "HOUSING", "UTILITIES",
  "ENTERTAINMENT", "TRAVEL", "HEALTH", "SHOPPING", "OTHER",
] as const;
export const EXPENSE_SPLIT_METHODS = ["EQUAL", "EXACT", "PERCENTAGE", "SHARES"] as const;

const decimalAmountSchema = z.string().trim().regex(
  /^\d+(?:\.\d{1,2})?$/,
  "Enter a valid amount with no more than two decimal places.",
)
  .refine((value) => parseDecimalToMinor(value) > 0, "Amount must be greater than zero.")
  .refine(
    (value) => parseDecimalToMinor(value) <= MAX_EXPENSE_MINOR,
    "Amount is too large.",
  );

const optionalDecimalSchema = z.string().trim().refine(
  (value) => value === "" || /^\d+(?:\.\d{1,2})?$/.test(value),
  "Enter a valid amount with no more than two decimal places.",
).refine(
  (value) => value === "" || parseDecimalToMinor(value) <= MAX_EXPENSE_MINOR,
  "Amount is too large.",
);

const memberAllocationSchema = z.object({
  amount: optionalDecimalSchema,
  memberId: z.string().uuid(),
});

const participantSchema = z.object({
  exactAmount: optionalDecimalSchema,
  included: z.boolean(),
  memberId: z.string().uuid(),
  percentage: optionalDecimalSchema,
  shares: z.string().trim().refine(
    (value) => value === "" || /^\d+$/.test(value),
    "Shares must be a whole number.",
  ),
});

export const expenseFormSchema = z.object({
  amount: decimalAmountSchema,
  category: z.enum(EXPENSE_CATEGORIES),
  currency: z.string().trim().regex(/^[A-Z]{3}$/, "Choose a valid currency."),
  date: z.iso.date("Choose a valid date."),
  description: z.string().trim().min(1, "Enter a description.").max(
    EXPENSE_DESCRIPTION_MAX_LENGTH,
    `Description must be ${EXPENSE_DESCRIPTION_MAX_LENGTH} characters or less.`,
  ),
  notes: z.string().trim().max(
    EXPENSE_NOTES_MAX_LENGTH,
    `Notes must be ${EXPENSE_NOTES_MAX_LENGTH} characters or less.`,
  ),
  participants: z.array(participantSchema).min(1),
  payers: z.array(memberAllocationSchema).min(1),
  splitMethod: z.enum(EXPENSE_SPLIT_METHODS),
}).superRefine((data, context) => {
  if (new Set(data.payers.map(({ memberId }) => memberId)).size !== data.payers.length) {
    context.addIssue({ code: "custom", message: "Each payer can appear only once.", path: ["payers"] });
  }
  if (new Set(data.participants.map(({ memberId }) => memberId)).size !== data.participants.length) {
    context.addIssue({ code: "custom", message: "Each participant can appear only once.", path: ["participants"] });
  }
  if (!data.payers.some(({ amount }) => parseDecimalToMinor(amount) > 0)) {
    context.addIssue({ code: "custom", message: "Enter an amount for at least one payer.", path: ["payers"] });
  }

  const totalMinor = parseDecimalToMinor(data.amount);
  const paidMinor = data.payers.reduce((sum, { amount }) => {
    const parsed = parseDecimalToMinor(amount);
    return sum + (Number.isNaN(parsed) ? 0 : parsed);
  }, 0);
  if (Number.isSafeInteger(totalMinor) && paidMinor !== totalMinor) {
    context.addIssue({ code: "custom", message: "Payer amounts must equal the expense total.", path: ["payers"] });
  }

  if (!data.participants.some(({ included }) => included)) {
    context.addIssue({ code: "custom", message: "Choose at least one participant.", path: ["participants"] });
  }

  const included = data.participants.filter(({ included }) => included);
  if (data.splitMethod === "EXACT") {
    const exactTotal = included.reduce((sum, { exactAmount }) => {
      const parsed = parseDecimalToMinor(exactAmount);
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);
    if (included.some(({ exactAmount }) => Number.isNaN(parseDecimalToMinor(exactAmount))) || exactTotal !== totalMinor) {
      context.addIssue({ code: "custom", message: "Exact amounts must equal the expense total.", path: ["participants"] });
    }
  }
  if (data.splitMethod === "PERCENTAGE") {
    const percentageTotal = included.reduce((sum, { percentage }) => {
      const parsed = parsePercentageToBasisPoints(percentage);
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);
    if (included.some(({ percentage }) => Number.isNaN(parsePercentageToBasisPoints(percentage))) || percentageTotal !== 10_000) {
      context.addIssue({ code: "custom", message: "Percentages must total exactly 100%.", path: ["participants"] });
    }
  }
  if (data.splitMethod === "SHARES" && included.some(({ shares }) => !/^\d+$/.test(shares) || Number(shares) <= 0)) {
    context.addIssue({ code: "custom", message: "Each participant needs at least one whole share.", path: ["participants"] });
  }
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export const expenseFiltersSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  from: z.iso.date().optional(),
  memberId: z.string().uuid().optional(),
  search: z.string().trim().max(100).optional(),
  to: z.iso.date().optional(),
}).refine(
  ({ from, to }) => !from || !to || from <= to,
  { message: "The start date must be before the end date.", path: ["to"] },
);

export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;

export function parseDecimalToMinor(value: string): number {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  const [whole, fraction = ""] = normalized.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(minor) ? minor : Number.NaN;
}

export function parsePercentageToBasisPoints(value: string): number {
  return parseDecimalToMinor(value);
}
