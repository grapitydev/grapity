import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { createServer, type Server } from "node:http";
import { startHubServer } from "hub/serve";
import type { ServerType } from "@hono/node-server";

let upstream: Server;
let upstreamPort: number;
let hubServer: ServerType;
let hubPort: number;

beforeAll(async () => {
  upstream = createServer((req, res) => {
    if (req.url === "/v1/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  const upstreamAddress = upstream.address();
  upstreamPort = typeof upstreamAddress === "object" && upstreamAddress ? upstreamAddress.port : 0;

  const hub = await startHubServer({
    port: 0,
    proxyRegistryUrl: `http://127.0.0.1:${upstreamPort}`,
  });
  hubServer = hub.server;
  const hubAddress = hubServer.address();
  hubPort = typeof hubAddress === "object" && hubAddress ? hubAddress.port : 0;
});

afterAll(async () => {
  await new Promise((resolve) => hubServer.close(resolve));
  await new Promise((resolve) => upstream.close(resolve));
});

describe("hub serve — same-origin proxy mode", () => {
  test("exposes an empty registryUrl in /config.js so the SPA calls same-origin /v1", async () => {
    const res = await fetch(`http://127.0.0.1:${hubPort}/config.js`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('"registryUrl":""');
  });

  test("proxies /v1/* requests to the internal registry", async () => {
    const res = await fetch(`http://127.0.0.1:${hubPort}/v1/health`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  });
});
