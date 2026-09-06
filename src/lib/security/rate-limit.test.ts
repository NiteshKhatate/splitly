import { consumeRateLimit } from "./rate-limit";

describe("consumeRateLimit", () => {
  it("allows requests within the configured window", async () => {
    const database = { $queryRaw: jest.fn().mockResolvedValue([{ count: 2, windowStart: new Date() }]) };
    await expect(consumeRateLimit(database as never, "upload", "user-1", 5, 60)).resolves.toEqual({ allowed: true, retryAfterSeconds: 60 });
  });

  it("blocks requests over the limit without retaining the raw identifier", async () => {
    const database = { $queryRaw: jest.fn().mockResolvedValue([{ count: 6, windowStart: new Date() }]) };
    const result = await consumeRateLimit(database as never, "upload", "person@example.com", 5, 60);
    expect(result.allowed).toBe(false);
    const templateValues = database.$queryRaw.mock.calls[0].slice(1);
    expect(templateValues).not.toContain("person@example.com");
  });
});
