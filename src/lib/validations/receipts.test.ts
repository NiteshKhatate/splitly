import { MAX_RECEIPT_BYTES, receiptFileSchema } from "./receipts";

describe("receiptFileSchema", () => {
  it("accepts supported private receipt files", () => {
    expect(receiptFileSchema.safeParse({ name: "receipt.pdf", size: 1024, type: "application/pdf" }).success).toBe(true);
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(receiptFileSchema.safeParse({ name: "script.html", size: 1, type: "text/html" }).success).toBe(false);
    expect(receiptFileSchema.safeParse({ name: "empty.png", size: 0, type: "image/png" }).success).toBe(false);
    expect(receiptFileSchema.safeParse({ name: "large.jpg", size: MAX_RECEIPT_BYTES + 1, type: "image/jpeg" }).success).toBe(false);
  });
});
