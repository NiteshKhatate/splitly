import {
  buildApplicationUrl,
  getApplicationOrigin,
  getConfiguredApplicationOrigin,
} from "./application-url";

describe("application email URLs", () => {
  it("uses APP_URL instead of an internal request origin", () => {
    expect(buildApplicationUrl(
      "/invite/group-1",
      "http://localhost:3000",
      { APP_URL: "https://splitly.example", NODE_ENV: "production" },
    )).toBe("https://splitly.example/invite/group-1");
  });

  it("uses Vercel's production URL when APP_URL is not configured", () => {
    expect(getConfiguredApplicationOrigin({
      NODE_ENV: "production",
      VERCEL_PROJECT_PRODUCTION_URL: "splitly.example",
      VERCEL_URL: "splitly-preview.vercel.app",
    })).toBe("https://splitly.example");
  });

  it("allows localhost only outside production", () => {
    expect(getApplicationOrigin("http://localhost:3000", { NODE_ENV: "development" }))
      .toBe("http://localhost:3000");
    expect(() => getApplicationOrigin("http://localhost:3000", { NODE_ENV: "production" }))
      .toThrow("A public APP_URL is required for production email links.");
  });

  it("rejects insecure configured production origins and invalid paths", () => {
    expect(() => getConfiguredApplicationOrigin({ APP_URL: "http://splitly.example", NODE_ENV: "production" }))
      .toThrow("APP_URL must use HTTPS in production.");
    expect(() => getConfiguredApplicationOrigin({ APP_URL: "https://splitly.example/path", NODE_ENV: "production" }))
      .toThrow("APP_URL must be an HTTP(S) origin without a path, query, or fragment.");
    expect(() => buildApplicationUrl("invite/group-1", "https://splitly.example"))
      .toThrow("Application URL paths must start with '/'.");
  });
});
