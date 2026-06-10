import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "registry/server";

const baseSpec = makeSpec();

const validGatewayConfig = {
  name: "payments-api-gateway",
  provider: "kong",
  specName: "payments-api",
  specSemver: "1.0.0",
  routes: [
    { path: "/payments/{id}", methods: ["GET"] },
  ],
  environments: {
    staging: {
      kongAddr: "http://kong-staging:8001",
      upstream: "http://payments-service:8080",
      plugins: [
        { name: "rate-limiting", config: { minute: 5000 } },
      ],
    },
  },
  callerIdentification: {
    strategy: "first-match" as const,
    rules: [
      { source: "kong.consumer.id", confidence: "high" as const },
      { source: "ip+ua", confidence: "low" as const },
    ],
  },
  content: "apiVersion: v1\nkind: GatewayConfig\nspec:\n  name: payments-api-gateway\n  provider: kong\n",
};

let app: ReturnType<typeof createApp>;
let reset: () => Promise<void>;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ app, reset, cleanup } = await createTestApp());
}, 120_000);

beforeEach(async () => {
  await reset();
});

afterAll(async () => {
  await cleanup();
});

async function pushGatewayConfig() {
  await pushSpec(app, { content: baseSpec, name: "payments-api" });
  const res = await app.request("/v1/gateway-configs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validGatewayConfig),
  });
  expect(res.status).toBe(201);
}

const kongLogPayload = {
  service: { name: "payments-api-gateway" },
  route: { name: "payments-api-gateway-payments-id-get-0", paths: ["/payments/(?<id>[^/]+)"] },
  request: { method: "GET", uri: "/payments/123", headers: { "user-agent": "test-agent" } },
  response: { status: 200 },
  consumer: { id: "consumer-abc-123" },
  client_ip: "10.0.0.1",
  started_at: Date.now(),
};

describe("Gateway Log Ingestion", () => {
  it("ingests a Kong log and stores it", async () => {
    await pushGatewayConfig();

    const res = await app.request("/v1/gateway-logs/ingest/kong/staging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kongLogPayload),
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.status).toBe("ok");

    // Query it back
    const listRes = await app.request("/v1/gateway-logs?gatewayConfig=payments-api-gateway");
    const listBody = await listRes.json() as any;

    expect(listRes.status).toBe(200);
    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].gatewayConfigName).toBe("payments-api-gateway");
    expect(listBody.data[0].method).toBe("GET");
    expect(listBody.data[0].path).toBe("/payments/123");
    expect(listBody.data[0].status).toBe(200);
    expect(listBody.data[0].callerId).toBe("consumer-abc-123");
    expect(listBody.data[0].callerSource).toBe("kong.consumer.id");
    expect(listBody.data[0].callerConfidence).toBe("high");
  });

  it("falls back to ip+ua when no consumer and no configured header", async () => {
    await pushGatewayConfig();

    const payload = {
      service: { name: "payments-api-gateway" },
      route: { name: "payments-api-gateway-payments-id-get-0", paths: ["/payments/(?<id>[^/]+)"] },
      request: { method: "POST", uri: "/payments", headers: { "user-agent": "test-agent" } },
      response: { status: 201 },
      client_ip: "192.168.1.1",
      started_at: Date.now(),
    };

    const res = await app.request("/v1/gateway-logs/ingest/kong/staging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);

    const listRes = await app.request("/v1/gateway-logs?gatewayConfig=payments-api-gateway");
    const listBody = await listRes.json() as any;

    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].callerId).toBe("192.168.1.1::test-agent");
    expect(listBody.data[0].callerSource).toBe("ip+ua");
    expect(listBody.data[0].callerConfidence).toBe("low");
  });

  it("returns stats aggregated by endpoint", async () => {
    await pushGatewayConfig();

    // Ingest 3 logs
    for (let i = 0; i < 3; i++) {
      await app.request("/v1/gateway-logs/ingest/kong/staging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...kongLogPayload,
          consumer: { id: i === 0 ? "consumer-abc-123" : `consumer-${i}` },
          started_at: Date.now() - i * 1000,
        }),
      });
    }

    const statsRes = await app.request("/v1/gateway-logs/stats?gatewayConfig=payments-api-gateway");
    const statsBody = await statsRes.json() as any;

    expect(statsRes.status).toBe(200);
    expect(statsBody.data).toHaveLength(1);
    expect(Number(statsBody.data[0].totalCalls)).toBe(3);
    expect(Number(statsBody.data[0].uniqueCallerIds)).toBe(3);
    expect(statsBody.data[0].method).toBe("GET");
  });

  it("filters logs by environment", async () => {
    await pushGatewayConfig();

    await app.request("/v1/gateway-logs/ingest/kong/staging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(kongLogPayload),
    });

    const res = await app.request("/v1/gateway-logs?gatewayConfig=payments-api-gateway&environment=staging");
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it("returns 400 for missing service.name in payload", async () => {
    await pushGatewayConfig();

    const res = await app.request("/v1/gateway-logs/ingest/kong/staging", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request: { method: "GET" } }),
    });

    expect(res.status).toBe(400);
  });
});
