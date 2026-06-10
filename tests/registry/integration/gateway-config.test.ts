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
        { name: "jwt", config: { issuer: "https://auth.example.com", key_claim_name: "iss" } },
        { name: "http-log", config: { http_endpoint: "https://logs.example.com" } },
      ],
    },
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

describe("Scenario 1: Push valid gateway config", () => {
  it("pushes first gateway config and returns 201 with UUID version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validGatewayConfig),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(201);
    expect(body.data.config.name).toBe("payments-api-gateway");
    expect(body.data.version.id).toBeDefined();
    expect(body.data.version.content).toBeDefined();
    expect(body.data.version.routes).toHaveLength(1);
  });

  it("stores raw content in the version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validGatewayConfig),
    });

    const res = await app.request("/v1/gateway-configs/payments-api-gateway/versions");
    const body = await res.json() as any;

    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBeDefined();
    expect(body.data[0].content).toBeUndefined(); // list excludes content
  });

  it("full version includes content", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const pushRes = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validGatewayConfig),
    });
    const pushBody = await pushRes.json() as any;
    const versionId = pushBody.data.version.id;

    const res = await app.request(`/v1/gateway-configs/payments-api-gateway/versions/${versionId}`);
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.content).toBeDefined();
    expect(body.data.routes).toHaveLength(1);
  });
});

describe("Scenario 2: Validation failures on push", () => {
  it("returns 422 for unsupported provider", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validGatewayConfig,
        provider: "tyk",
      }),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(422);
    expect(body.error).toBe("unsupported_provider");
  });

  it("returns 422 when referenced spec does not exist", async () => {
    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validGatewayConfig),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(422);
    expect(body.error).toBe("spec_not_found");
  });

  it("returns 422 when declared route does not exist in spec", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validGatewayConfig,
        routes: [
          { path: "/does-not-exist", methods: ["GET"] },
        ],
      }),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(422);
    expect(body.error).toBe("route_not_found");
  });

  it("returns 422 when no environments are defined", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validGatewayConfig,
        environments: {},
      }),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(422);
    expect(body.error).toBe("no_environments");
  });
});

describe("Scenario 3: Version retention", () => {
  it("retains only latest 5 versions", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    for (let i = 0; i < 7; i++) {
      await app.request("/v1/gateway-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validGatewayConfig),
      });
    }

    const res = await app.request("/v1/gateway-configs/payments-api-gateway/versions");
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(5);
  });
});

describe("Scenario 4: Push new version to existing config", () => {
  it("creates a new version when pushing to an existing config name", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validGatewayConfig),
    });

    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validGatewayConfig,
        specSemver: "1.0.0",
      }),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(201);
    expect(body.data.config.name).toBe("payments-api-gateway");
    expect(body.data.version.id).toBeDefined();

    const versionsRes = await app.request("/v1/gateway-configs/payments-api-gateway/versions");
    const versionsBody = await versionsRes.json() as any;
    expect(versionsBody.data).toHaveLength(2);
  });
});

const yamlSpec = `openapi: "3.1.0"
info:
  title: Test API
  version: "1.0.0"
paths:
  /payments/{id}:
    get:
      operationId: getPayment
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Payment details
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
`;

describe("Scenario 5: Spec pushed as YAML", () => {
  it("pushes gateway config when spec was pushed as YAML", async () => {
    await pushSpec(app, { content: yamlSpec, name: "payments-api" });

    const res = await app.request("/v1/gateway-configs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validGatewayConfig),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(201);
    expect(body.data.config.name).toBe("payments-api-gateway");
    expect(body.data.version.id).toBeDefined();
  });
});
