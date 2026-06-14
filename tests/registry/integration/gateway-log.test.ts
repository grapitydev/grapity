import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import { fetchToken, startKeycloak, REALM } from "./keycloak";
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
let readToken: string;
let writeToken: string;

let keycloakServerUrl: string;

beforeAll(async () => {
  if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
    return;
  }

  const keycloak = await startKeycloak();
  keycloakServerUrl = keycloak.serverUrl;

  writeToken = await fetchToken(keycloakServerUrl, "grapity-cli", "grapity-cli-secret");
  readToken = await fetchToken(
    keycloakServerUrl,
    "grapity-cli-limited",
    "grapity-cli-limited-secret"
  );

  const testApp = await createTestApp({
    auth: {
      mode: "keycloak",
      serverUrl: keycloakServerUrl,
      realm: REALM,
      audience: "grapity-cli",
      roleSource: "scope",
    },
  });

  app = testApp.app;
  reset = testApp.reset;

  const originalCleanup = testApp.cleanup;
  cleanup = async () => {
    await originalCleanup();
    await keycloak.stop();
  };
}, 300_000);

describe("Gateway Log Ingestion", () => {
  beforeEach(async () => {
    if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
      return;
    }
    await reset();
  });

  afterAll(async () => {
    if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
      return;
    }
    await cleanup();
  });

  async function pushGatewayConfig(token: string) {
    await pushSpec(app, { content: baseSpec, name: "payments-api" }, token);
    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(validGatewayConfig),
    });
    expect(res.status).toBe(201);
  }

  async function ingestLog(token?: string) {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return app.request("/v1/gateway-logs/ingest/kong/staging", {
      method: "POST",
      headers,
      body: JSON.stringify(kongLogPayload),
    });
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

  it("rejects ingest requests without a Bearer token", async () => {
    const res = await ingestLog();
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unauthorized");
  });

  it("rejects ingest requests when token is missing gateway-logs:write", async () => {
    await pushGatewayConfig(writeToken);
    const res = await ingestLog(readToken);
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("forbidden");
  });

  it("ingests a Kong log and stores it with a valid gateway token", async () => {
    await pushGatewayConfig(writeToken);

    const res = await ingestLog(writeToken);
    expect(res.status).toBe(201);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");

    const listRes = await app.request("/v1/gateway-logs?gatewayConfig=payments-api-gateway", {
      headers: { Authorization: `Bearer ${writeToken}` },
    });
    const listBody = (await listRes.json()) as {
      data: Array<{
        gatewayConfigName: string;
        method: string;
        path: string;
        status: number;
        callerId: string;
        callerSource: string;
        callerConfidence: string;
      }>;
    };

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
    await pushGatewayConfig(writeToken);

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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${writeToken}`,
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);

    const listRes = await app.request("/v1/gateway-logs?gatewayConfig=payments-api-gateway", {
      headers: { Authorization: `Bearer ${writeToken}` },
    });
    const listBody = (await listRes.json()) as {
      data: Array<{
        callerId: string;
        callerSource: string;
        callerConfidence: string;
      }>;
    };

    expect(listBody.data).toHaveLength(1);
    expect(listBody.data[0].callerId).toBe("192.168.1.1::test-agent");
    expect(listBody.data[0].callerSource).toBe("ip+ua");
    expect(listBody.data[0].callerConfidence).toBe("low");
  });

  it("returns stats aggregated by endpoint", async () => {
    await pushGatewayConfig(writeToken);

    for (let i = 0; i < 3; i++) {
      await app.request("/v1/gateway-logs/ingest/kong/staging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${writeToken}`,
        },
        body: JSON.stringify({
          ...kongLogPayload,
          consumer: { id: i === 0 ? "consumer-abc-123" : `consumer-${i}` },
          started_at: Date.now() - i * 1000,
        }),
      });
    }

    const statsRes = await app.request("/v1/gateway-logs/stats?gatewayConfig=payments-api-gateway", {
      headers: { Authorization: `Bearer ${writeToken}` },
    });
    const statsBody = (await statsRes.json()) as {
      data: Array<{
        totalCalls: number | string;
        uniqueCallerIds: number | string;
        method: string;
      }>;
    };

    expect(statsRes.status).toBe(200);
    expect(statsBody.data).toHaveLength(1);
    expect(Number(statsBody.data[0].totalCalls)).toBe(3);
    expect(Number(statsBody.data[0].uniqueCallerIds)).toBe(3);
    expect(statsBody.data[0].method).toBe("GET");
  });

  it("filters logs by environment", async () => {
    await pushGatewayConfig(writeToken);

    await app.request("/v1/gateway-logs/ingest/kong/staging", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${writeToken}`,
      },
      body: JSON.stringify(kongLogPayload),
    });

    const res = await app.request("/v1/gateway-logs?gatewayConfig=payments-api-gateway&environment=staging", {
      headers: { Authorization: `Bearer ${writeToken}` },
    });
    const body = (await res.json()) as { data: unknown[] };

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it("returns 400 for missing service.name in payload", async () => {
    await pushGatewayConfig(writeToken);

    const res = await app.request("/v1/gateway-logs/ingest/kong/staging", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${writeToken}`,
      },
      body: JSON.stringify({ request: { method: "GET" } }),
    });

    expect(res.status).toBe(400);
  });
});
