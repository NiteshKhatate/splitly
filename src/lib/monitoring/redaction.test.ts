import { installServerConsoleRedaction, redactForLogging } from "./redaction";

describe("redactForLogging", () => {
  it("redacts credentials, PII, and financial fields recursively", () => {
    expect(redactForLogging({
      amountMinor: 5000,
      nested: { authorization: "Bearer abc", message: "Contact person@example.com" },
      password: "secret",
    })).toEqual({
      amountMinor: "[REDACTED]",
      nested: { authorization: "[REDACTED]", message: "Contact [REDACTED_EMAIL]" },
      password: "[REDACTED]",
    });
  });

  it("redacts secrets embedded in error strings", () => {
    expect(redactForLogging("failed postgresql://user:pass@host/db Bearer token"))
      .toBe("failed [REDACTED_DATABASE_URL] Bearer [REDACTED]");
  });

  it("redacts existing server console calls centrally", () => {
    const originalWarn = console.warn;
    const warning = jest.fn();
    console.warn = warning;
    installServerConsoleRedaction();
    console.warn("event", { email: "person@example.com", safe: "value" });
    expect(warning).toHaveBeenCalledWith("event", { email: "[REDACTED]", safe: "value" });
    console.warn = originalWarn;
  });
});
