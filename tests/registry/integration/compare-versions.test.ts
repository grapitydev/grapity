import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "registry/server";

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

function specV1() {
  return makeSpec({
    paths: {
      "/payments/{id}": {
        get: {
          operationId: "getPayment",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } },
                },
              },
            },
          },
        },
      },
    },
  });
}

function specV2() {
  return makeSpec({
    paths: {
      "/payments/{id}": {
        get: {
          operationId: "getPayment",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "ok",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } } },
                },
              },
            },
          },
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
}

function specV3() {
  return makeSpec({
    paths: {
      "/payments/{id}": {
        get: {
          operationId: "getPayment",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
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
      "/payments/{id}/refunds": {
        get: {
          operationId: "getPaymentRefunds",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "ok" } },
        },
      },
      "/payments/{id}/history": {
        get: {
          operationId: "getPaymentHistory",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "ok" } },
        },
      },
    },
  });
}

function specV4() {
  return makeSpec({
    paths: {
      "/payments/{id}": {
        get: {
          operationId: "getPayment",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
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
                      currency: { type: "string" },
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
}

async function setupFourVersions() {
  await pushSpec(app, { content: specV1(), name: "payments-api" });
  await pushSpec(app, { content: specV2(), name: "payments-api" });
  await pushSpec(app, { content: specV3(), name: "payments-api" });
  await pushSpec(app, { content: specV4(), name: "payments-api", force: true, reason: "remove refunds endpoint" });
}

describe("GET /v1/specs/{name}/compare", () => {
  it("returns incremental steps between two versions", async () => {
    await setupFourVersions();

    const res = await app.request("/v1/specs/payments-api/compare?from=1.0.0&to=2.0.0");
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.from).toBe("1.0.0");
    expect(body.data.to).toBe("2.0.0");
    expect(body.data.steps).toHaveLength(3);

    expect(body.data.steps[0].version).toBe("1.1.0");
    expect(body.data.steps[0].previousVersion).toBe("1.0.0");
    expect(body.data.steps[0].classification).toBe("minor");
    expect(body.data.steps[0].breakingChanges).toHaveLength(0);
    expect(body.data.steps[0].safeChanges.length).toBeGreaterThan(0);

    expect(body.data.steps[1].version).toBe("1.2.0");
    expect(body.data.steps[1].previousVersion).toBe("1.1.0");
    expect(body.data.steps[1].safeChanges.length).toBeGreaterThan(0);

    expect(body.data.steps[2].version).toBe("2.0.0");
    expect(body.data.steps[2].previousVersion).toBe("1.2.0");
    expect(body.data.steps[2].classification).toBe("major");
    expect(body.data.steps[2].breakingChanges.length).toBeGreaterThan(0);
  });

  it("normalizes reverse order params", async () => {
    await setupFourVersions();

    const res = await app.request("/v1/specs/payments-api/compare?from=2.0.0&to=1.0.0");
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.from).toBe("1.0.0");
    expect(body.data.to).toBe("2.0.0");
    expect(body.data.steps).toHaveLength(3);
    expect(body.data.steps[0].version).toBe("1.1.0");
    expect(body.data.steps[2].version).toBe("2.0.0");
  });

  it("returns empty steps when from equals to", async () => {
    await setupFourVersions();

    const res = await app.request("/v1/specs/payments-api/compare?from=1.1.0&to=1.1.0");
    const body = (await res.json()) as any;

    expect(res.status).toBe(200);
    expect(body.data.from).toBe("1.1.0");
    expect(body.data.to).toBe("1.1.0");
    expect(body.data.steps).toHaveLength(0);
  });

  it("returns 404 for unknown spec", async () => {
    const res = await app.request("/v1/specs/unknown-api/compare?from=1.0.0&to=1.1.0");
    const body = (await res.json()) as any;

    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });

  it("returns 404 for missing version", async () => {
    await pushSpec(app, { content: specV1(), name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/compare?from=1.0.0&to=9.9.9");
    const body = (await res.json()) as any;

    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });
});
