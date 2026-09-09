import { z } from "zod";

export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
export const RECEIPT_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"] as const;

export const receiptFileSchema = z.object({
  name: z.string().trim().min(1).max(200).refine(
    (name) => !/[\\/\u0000-\u001F\u007F]/.test(name),
    "Receipt filename contains unsupported characters.",
  ),
  size: z.number().int().positive("Choose a non-empty receipt file.").max(MAX_RECEIPT_BYTES, "Receipt files must be 5 MB or smaller."),
  type: z.enum(RECEIPT_MIME_TYPES, { error: "Choose a JPEG, PNG, or PDF receipt." }),
});

const signatures: Record<(typeof RECEIPT_MIME_TYPES)[number], readonly number[]> = {
  "application/pdf": [0x25, 0x50, 0x44, 0x46, 0x2d],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
};

export function hasExpectedReceiptSignature(
  bytes: ArrayBuffer,
  mimeType: (typeof RECEIPT_MIME_TYPES)[number],
): boolean {
  const data = new Uint8Array(bytes);
  return signatures[mimeType].every((byte, index) => data[index] === byte);
}

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
