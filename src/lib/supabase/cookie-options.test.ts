import { secureCookieOptions } from "./cookie-options";

describe("secureCookieOptions", () => {
  const originalEnvironment = process.env.NODE_ENV;

  afterEach(() => Object.defineProperty(process.env, "NODE_ENV", { configurable: true, value: originalEnvironment }));

  it("enforces Secure and SameSite in production", () => {
    Object.defineProperty(process.env, "NODE_ENV", { configurable: true, value: "production" });
    expect(secureCookieOptions({ path: "/" })).toEqual({ path: "/", sameSite: "lax", secure: true });
  });

  it("preserves stricter provider cookie settings", () => {
    Object.defineProperty(process.env, "NODE_ENV", { configurable: true, value: "development" });
    expect(secureCookieOptions({ sameSite: "strict", secure: false })).toEqual({ sameSite: "strict", secure: false });
  });
});
