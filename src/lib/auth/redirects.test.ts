import { AUTHENTICATED_HOME, getSafeRedirectPath } from "./redirects";

describe("auth redirects", () => {
  it("allows local absolute paths", () => {
    expect(getSafeRedirectPath("/groups/group-1")).toBe("/groups/group-1");
  });

  it("normalizes an absolute same-origin URL to an internal path", () => {
    expect(getSafeRedirectPath(
      "https://splitly.example/groups/group-1?tab=balances#member",
      "https://splitly.example",
    )).toBe("/groups/group-1?tab=balances#member");
  });

  it.each([
    undefined,
    null,
    "",
    "dashboard",
    "https://evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "/%2fevil.example",
    "/%5cevil.example",
    "/groups/%2Fadmin",
    "/groups/\u0000admin",
    " /groups/group-1",
  ])(
    "falls back for unsafe redirect value %p",
    (value) => {
      expect(getSafeRedirectPath(value)).toBe(AUTHENTICATED_HOME);
    },
  );

  it("rejects an absolute alternate origin when a canonical origin is supplied", () => {
    expect(getSafeRedirectPath(
      "https://evil.example/groups/group-1",
      "https://splitly.example",
    )).toBe(AUTHENTICATED_HOME);
  });
});
