import { AUTHENTICATED_HOME, getSafeRedirectPath } from "./redirects";

describe("auth redirects", () => {
  it("allows local absolute paths", () => {
    expect(getSafeRedirectPath("/groups/group-1")).toBe("/groups/group-1");
  });

  it.each([undefined, null, "", "dashboard", "https://evil.example", "//evil.example/path"])(
    "falls back for unsafe redirect value %p",
    (value) => {
      expect(getSafeRedirectPath(value)).toBe(AUTHENTICATED_HOME);
    },
  );
});
