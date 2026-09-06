import { requestGuardFailure } from "./request-guards";

const request = { contentLength: "100", method: "POST", origin: "https://splitly.test", pathname: "/groups", requestOrigin: "https://splitly.test" };

describe("requestGuardFailure", () => {
  it("allows safe methods and same-origin mutations", () => {
    expect(requestGuardFailure(request)).toBeNull();
    expect(requestGuardFailure({ ...request, method: "GET", origin: null })).toBeNull();
  });

  it("rejects cross-site or originless mutations", () => {
    expect(requestGuardFailure({ ...request, origin: "https://attacker.test" })).toEqual({ message: "Invalid request origin.", status: 403 });
    expect(requestGuardFailure({ ...request, origin: null })).toEqual({ message: "Invalid request origin.", status: 403 });
  });

  it("enforces smaller JSON and bounded receipt bodies", () => {
    expect(requestGuardFailure({ ...request, contentLength: "1000001" })).toEqual({ message: "Request body is too large.", status: 413 });
    expect(requestGuardFailure({ ...request, contentLength: "5242880", pathname: "/expenses/id/receipts" })).toBeNull();
    expect(requestGuardFailure({ ...request, contentLength: "5500001", pathname: "/expenses/id/receipts" })).toEqual({ message: "Request body is too large.", status: 413 });
  });
});
