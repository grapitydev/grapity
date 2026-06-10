import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "registry/server";

const baseSpec = makeSpec();

const specWithBreakingChange = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "currency", in: "query", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } } } } } },
      },
    },
  },
});

const specWithNewEndpoint = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok", content: { "application/json": { schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } } } } } },
      },
    },
    "/payments/{id}/refunds": {
      get: {
        operationId: "getPaymentRefunds",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok" } },
      },
    },
  },
});

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

describe("Scenario 9: CI validate before pushing", () => {
  it("validate returns valid: false with compat report for breaking spec", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: specWithBreakingChange }),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.valid).toBe(false);
    expect(body.data.compatReport.breakingChanges.length).toBeGreaterThan(0);
  });

  it("validate does not store anything", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await app.request("/v1/specs/payments-api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: specWithBreakingChange }),
    });

    const res = await app.request("/v1/specs/payments-api");
    const body = await res.json() as any;
    expect(body.data.latestVersion.semver).toBe("1.0.0");
  });

  it("validate returns valid: true for sunset-eligible field removals", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
              { name: "expand", in: "query", required: false, schema: { type: "string" }, deprecated: true, "x-sunset": "2020-01-01" },
            ],
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "number" },
                        warehouse: { type: "string", deprecated: true, "x-sunset": "2020-01-01" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    await pushSpec(app, { content: specV1, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: specV2 }),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.valid).toBe(true);
    expect(body.data.compatReport.breakingChanges).toHaveLength(2);
    expect(body.data.compatReport.breakingChanges.map((b: any) => b.rule)).toContain("param-removed");
    expect(body.data.compatReport.breakingChanges.map((b: any) => b.rule)).toContain("response-property-removed");
  });

  it("validate returns valid: false for blocked field removal without deprecation", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
              { name: "expand", in: "query", required: false, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "number" },
                        warehouse: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "number" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    await pushSpec(app, { content: specV1, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: specV2 }),
    });
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.valid).toBe(false);
    expect(body.data.compatReport.breakingChanges.length).toBeGreaterThanOrEqual(2);
    expect(body.data.compatReport.breakingChanges.map((b: any) => b.rule)).toContain("param-removed-without-deprecation");
    expect(body.data.compatReport.breakingChanges.map((b: any) => b.rule)).toContain("response-property-removed-without-deprecation");
  });
});
