import { isProtected } from "./protected-routes";

describe("protected application routes", () => {
  it.each([
    "/activity",
    "/dashboard",
    "/expenses/expense-1",
    "/exports/expenses.csv",
    "/groups/group-1",
    "/settings",
  ])("protects %s", (pathname) => {
    expect(isProtected(pathname)).toBe(true);
  });

  it.each(["/", "/login", "/signup", "/activity-public"])("does not protect %s", (pathname) => {
    expect(isProtected(pathname)).toBe(false);
  });
});
