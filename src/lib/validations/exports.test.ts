import { expenseExportSchema } from "./exports";

describe("expenseExportSchema", () => {
  const groupId = "00000000-0000-4000-8000-000000000001";

  it("accepts an authorized export filter shape", () => {
    expect(expenseExportSchema.parse({ groupId, from: "2026-09-01", to: "2026-09-30" })).toEqual({ groupId, from: "2026-09-01", to: "2026-09-30" });
  });

  it("rejects invalid groups and reversed dates", () => {
    expect(expenseExportSchema.safeParse({ groupId: "bad" }).success).toBe(false);
    expect(expenseExportSchema.safeParse({ groupId, from: "2026-10-01", to: "2026-09-01" }).success).toBe(false);
  });
});
