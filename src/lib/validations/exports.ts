import { z } from "zod";

export const expenseExportSchema = z.object({
  from: z.iso.date().optional(),
  groupId: z.string().uuid(),
  to: z.iso.date().optional(),
}).refine(
  ({ from, to }) => !from || !to || from <= to,
  { message: "The start date must be before the end date.", path: ["to"] },
);

export type ExpenseExportFilters = z.infer<typeof expenseExportSchema>;
