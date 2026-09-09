/** @jest-environment node */

import { readJsonBody, RequestBodyError } from "./request-body";

describe("readJsonBody", () => {
  it("parses a bounded JSON body without relying on Content-Length", async () => {
    const request = new Request("https://splitly.test/expense", {
      body: JSON.stringify({ amount: "10.00" }),
      method: "POST",
    });

    await expect(readJsonBody(request, 100)).resolves.toEqual({ amount: "10.00" });
  });

  it("rejects a streamed body after it crosses the byte limit", async () => {
    const request = new Request("https://splitly.test/expense", {
      body: JSON.stringify({ value: "x".repeat(100) }),
      method: "POST",
    });

    await expect(readJsonBody(request, 20)).rejects.toEqual(
      new RequestBodyError("TOO_LARGE"),
    );
  });

  it("rejects malformed JSON", async () => {
    const request = new Request("https://splitly.test/expense", {
      body: "not-json",
      method: "POST",
    });

    await expect(readJsonBody(request)).rejects.toEqual(new RequestBodyError("INVALID_JSON"));
  });
});
