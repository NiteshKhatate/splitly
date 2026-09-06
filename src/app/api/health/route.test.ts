/** @jest-environment node */

import { getDb } from "@/server/db";

import { GET } from "./route";

jest.mock("@/server/db", () => ({ getDb: jest.fn() }));

describe("health route", () => {
  it("reports application and database availability without connection details", async () => {
    jest.mocked(getDb).mockReturnValue({ $queryRaw: jest.fn().mockResolvedValue([{ value: 1 }]) } as never);
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toEqual({ database: "available", responseTimeMs: expect.any(Number), status: "ok" });
    expect(JSON.stringify(body)).not.toMatch(/postgres|credential|connection/i);
  });

  it("returns a safe degraded response when the database is unavailable", async () => {
    jest.mocked(getDb).mockReturnValue({ $queryRaw: jest.fn().mockRejectedValue(new Error("secret database detail")) } as never);
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      database: "unavailable",
      responseTimeMs: expect.any(Number),
      status: "degraded",
    });
  });
});
