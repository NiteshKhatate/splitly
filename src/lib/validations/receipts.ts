import { z } from "zod";

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export const receiptFileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  size: z.number().int().positive("Choose a non-empty receipt file.").max(MAX_RECEIPT_BYTES, "Receipt files must be 5 MB or smaller."),
  type: z.enum(RECEIPT_MIME_TYPES, { error: "Choose a JPEG, PNG, or PDF receipt." }),
});

export const receiptUploadFormSchema = z.object({
  receipt: z.custom<FileList>((value) => Boolean(
    value && typeof value === "object" && "length" in value && (value as FileList).length === 1,
  ), "Choose a receipt file."),
}).superRefine(({ receipt }, context) => {
  const file = receipt?.item(0);
  if (!file) return;
  const validation = receiptFileSchema.safeParse(file);
  if (!validation.success) {
    context.addIssue({ code: "custom", message: validation.error.issues[0]?.message ?? "Choose a valid receipt.", path: ["receipt"] });
  }
});

export type ReceiptUploadFormValues = z.infer<typeof receiptUploadFormSchema>;
