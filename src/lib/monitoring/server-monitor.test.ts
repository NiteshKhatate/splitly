/** @jest-environment node */

import { captureServerError } from "./server-monitor";

describe("captureServerError", () => {
  const originalWebhook = process.env.ERROR_MONITORING_WEBHOOK_URL;

  afterEach(() => {
    process.env.ERROR_MONITORING_WEBHOOK_URL = originalWebhook;
    jest.restoreAllMocks();
  });

  it("bounds monitoring delivery with an abort signal", async () => {
    process.env.ERROR_MONITORING_WEBHOOK_URL = "https://monitoring.splitly.test/events";
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response());
    jest.spyOn(console, "error").mockImplementation(() => undefined);

    await captureServerError("test_error", { email: "person@example.com" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://monitoring.splitly.test/events",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock.mock.calls[0][1]?.body).not.toContain("person@example.com");
  });
});
