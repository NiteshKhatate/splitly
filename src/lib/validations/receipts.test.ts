import {
  hasExpectedReceiptSignature,
  MAX_RECEIPT_BYTES,
  receiptFileSchema,
} from "./receipts";

describe("receiptFileSchema", () => {
  it("accepts supported private receipt files", () => {
    expect(receiptFileSchema.safeParse({ name: "receipt.pdf", size: 1024, type: "application/pdf" }).success).toBe(true);
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(receiptFileSchema.safeParse({ name: "script.html", size: 1, type: "text/html" }).success).toBe(false);
    expect(receiptFileSchema.safeParse({ name: "empty.png", size: 0, type: "image/png" }).success).toBe(false);
    expect(receiptFileSchema.safeParse({ name: "large.jpg", size: MAX_RECEIPT_BYTES + 1, type: "image/jpeg" }).success).toBe(false);
  });

  it("rejects path and control characters in filenames", () => {
    expect(receiptFileSchema.safeParse({ name: "../receipt.pdf", size: 10, type: "application/pdf" }).success).toBe(false);
    expect(receiptFileSchema.safeParse({ name: "receipt\n.pdf", size: 10, type: "application/pdf" }).success).toBe(false);
  });

  it.each([
    ["application/pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]],
    ["image/jpeg", [0xff, 0xd8, 0xff, 0xe0]],
    ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ] as const)("checks the actual %s file signature", (mimeType, bytes) => {
    expect(hasExpectedReceiptSignature(Uint8Array.from(bytes).buffer, mimeType)).toBe(true);
    expect(hasExpectedReceiptSignature(Uint8Array.from([0x00, ...bytes]).buffer, mimeType)).toBe(false);
  });
});
