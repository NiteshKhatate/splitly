import { z } from "zod";

import { MAX_EXPENSE_MINOR, parseDecimalToMinor } from "./expenses";

export const SETTLEMENT_NOTE_MAX_LENGTH = 300;

export const settlementFormSchema = z.object({
  amount: z.string().trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a valid amount with no more than two decimal places.")
    .refine((value) => parseDecimalToMinor(value) > 0, "Amount must be greater than zero.")
    .refine((value) => parseDecimalToMinor(value) <= MAX_EXPENSE_MINOR, "Amount is too large."),
  currency: z.string().regex(/^[A-Z]{3}$/, "Choose a valid currency."),
  date: z.iso.date("Choose a valid date."),
  note: z.string().trim().max(SETTLEMENT_NOTE_MAX_LENGTH, `Note must be ${SETTLEMENT_NOTE_MAX_LENGTH} characters or less.`),
  payeeId: z.string().uuid("Choose who received the payment."),
  payerId: z.string().uuid("Choose who paid."),
}).refine(({ payeeId, payerId }) => payeeId !== payerId, {
  message: "Payer and recipient must be different people.", path: ["payeeId"],
});

export type SettlementFormValues = z.infer<typeof settlementFormSchema>;
