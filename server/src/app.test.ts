import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { app } from "./app.js";

describe("health endpoint", () => {
  it("returns a structured healthy response", async () => {
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start.");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`);
    const body = await response.json() as { success: boolean; data: { status: string } };
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("healthy");
  });

  it("exposes bounded Prometheus metrics without authentication", async () => {
    const server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Test server did not start.");
    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/metrics`);
    const body = await response.text();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(body).toContain("rolescout_http_requests_total");
  });
});
