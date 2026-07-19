import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startServer, type RunningServer } from "registry/serve";
import { makeSpec } from "./helpers";

let tmpDir: string;
let running: RunningServer;
let baseUrl: string;

beforeAll(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "grapity-sqlite-it-"));
  running = await startServer({
    port: 0,
    database: "sqlite",
    sqlitePath: path.join(tmpDir, "registry.db"),
    auth: { mode: "none" },
  });
  const address = running.server.address();
  if (typeof address !== "object" || address === null) {
    throw new Error("server did not bind to a port");
  }
  baseUrl = `http://localhost:${address.port}`;
}, 30_000);

afterAll(async () => {
  running.server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("registry over HTTP with SQLite backend", () => {
  it("serves health", async () => {
    const res = await fetch(`${baseUrl}/v1/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe("ok");
  });

  it("pushes, lists and fetches spec versions end-to-end", async () => {
    const push = await fetch(`${baseUrl}/v1/specs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: makeSpec(), name: "payments-api" }),
    });
    expect(push.status).toBe(201);
    const pushed = (await push.json()) as any;
    expect(pushed.data.isNewSpec).toBe(true);
    expect(pushed.data.version.semver).toBe("1.0.0");

    const pushNext = await fetch(`${baseUrl}/v1/specs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: makeSpec({ info: { title: "Test API", version: "9.9.9" } }),
        name: "payments-api",
      }),
    });
    expect(pushNext.status).toBe(201);

    const res = await fetch(`${baseUrl}/v1/specs/payments-api`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.spec.name).toBe("payments-api");
    expect(body.data.latestVersion.semver).toBe("1.0.1");

    const versions = await fetch(`${baseUrl}/v1/specs/payments-api/versions`);
    expect(versions.status).toBe(200);
    const versionList = (await versions.json()) as any;
    expect(versionList.data.length).toBe(2);

    expect(fs.existsSync(path.join(tmpDir, "registry.db"))).toBe(true);
  });

  it("restarts on the same database file without losing data", async () => {
    const second = await startServer({
      port: 0,
      database: "sqlite",
      sqlitePath: path.join(tmpDir, "registry.db"),
      auth: { mode: "none" },
    });
    try {
      const address = second.server.address();
      if (typeof address !== "object" || address === null) {
        throw new Error("server did not bind to a port");
      }
      const res = await fetch(`http://localhost:${address.port}/v1/specs/payments-api`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as any;
      expect(body.data.latestVersion.semver).toBe("1.0.1");
    } finally {
      second.server.close();
    }
  });
});
