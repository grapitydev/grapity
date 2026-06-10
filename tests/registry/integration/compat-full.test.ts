import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "registry/server";

const baseSpec = makeSpec();

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

// ---------------------------------------------------------------------------
// 1. Endpoint Lifecycle
// ---------------------------------------------------------------------------

describe("Endpoint lifecycle", () => {
  it("1.1 add new endpoint → minor, 0 breaking, 1 safe structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        ...JSON.parse(baseSpec).paths,
        "/payments/{id}/refunds": {
          get: {
            operationId: "getRefunds",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("endpoint-added");
    expect(body.data.compatReport.safeChanges[0].category).toBe("structural");
  });

  it("1.5 mark endpoint deprecated → minor, 0 breaking, 1 safe structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            deprecated: true,
            "x-sunset": "2027-12-31",
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("endpoint-deprecated");
  });

  it("1.6 un-deprecate endpoint → patch, 0 breaking, 1 safe documentation", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            deprecated: true,
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
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
    const { res, body } = await pushSpec(app, { content: baseSpec, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("endpoint-un-deprecated");
    expect(body.data.compatReport.safeChanges[0].category).toBe("documentation");
  });

  it("1.7 mark stable endpoint as draft → major, 1 breaking structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            "x-draft": true,
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("stable-endpoint-marked-draft");
    expect(body.compatReport.breakingChanges[0].category).toBe("structural");
  });

  it("1.8 mark draft endpoint as stable → patch, 0 breaking, 1 safe structural", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            "x-draft": true,
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
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
    const { res, body } = await pushSpec(app, { content: baseSpec, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("draft-endpoint-marked-stable");
    expect(body.data.compatReport.safeChanges[0].category).toBe("documentation");
  });
});

// ---------------------------------------------------------------------------
// 2. Operation Metadata
// ---------------------------------------------------------------------------

describe("Operation metadata (documentation)", () => {
  it("2.1 change operationId → patch, 0 breaking, 1 safe documentation", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPaymentV2",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("operation-id-changed");
    expect(body.data.compatReport.safeChanges[0].category).toBe("documentation");
  });
});

// ---------------------------------------------------------------------------
// 3. Parameter Changes
// ---------------------------------------------------------------------------

describe("Parameter changes", () => {
  it("3.1 add optional parameter → minor, 0 breaking, 1 safe structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("optional-request-param-added");
  });

  it("3.2 add required parameter → major, 1 breaking structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
              { name: "currency", in: "query", required: true, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("required-request-param-added");
    expect(body.compatReport.breakingChanges[0].category).toBe("structural");
  });

  it("3.4 remove parameter → major, 1 breaking structural", async () => {
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
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
    const { res, body } = await pushSpec(app, { content: baseSpec, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("param-removed-without-deprecation");
  });

  it("3.6 change parameter type → major, 1 breaking structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("param-type-changed");
  });

  it("3.8 make optional parameter required → major, 1 breaking structural", async () => {
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
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
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
              { name: "expand", in: "query", required: true, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("param-now-required");
  });
});

// ---------------------------------------------------------------------------
// 4. Request Body Changes
// ---------------------------------------------------------------------------

describe("Request body changes", () => {
  const specWithRequestBody = makeSpec({
    paths: {
      "/payments": {
        post: {
          operationId: "createPayment",
          requestBody: {
            description: "Payment payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    amount: { type: "number" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" } },
        },
      },
    },
  });

  const specWithRequestBodyAndCurrency = makeSpec({
    paths: {
      "/payments": {
        post: {
          operationId: "createPayment",
          requestBody: {
            description: "Payment payload",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    amount: { type: "number" },
                    currency: { type: "string" },
                  },
                },
              },
            },
          },
          responses: { "201": { description: "Created" } },
        },
      },
    },
  });

  it("4.1 add request body where none existed → major, 1 breaking structural", async () => {
    const specNoBody = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    await pushSpec(app, { content: specNoBody, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithRequestBody, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("request-body-added");
  });

  it("4.2 remove request body → patch, 0 breaking, 1 safe structural", async () => {
    await pushSpec(app, { content: specWithRequestBody, name: "payments-api" });
    const specNoBody = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specNoBody, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("request-body-removed");
  });

  it("4.4 add optional property to request body → patch, 0 breaking, 1 safe structural", async () => {
    await pushSpec(app, { content: specWithRequestBody, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specWithRequestBodyAndCurrency, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("request-body-property-added");
  });
});

// ---------------------------------------------------------------------------
// 5. Response Changes
// ---------------------------------------------------------------------------

describe("Response changes", () => {
  it("5.4 add property to response schema → patch, 0 breaking, 1 safe structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
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
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("response-property-added");
  });

  it("5.5 remove property from response schema → major, 1 breaking structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("response-property-removed-without-deprecation");
  });

  it("5.7 change response property type → major, 1 breaking structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "string" },
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
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("response-property-type-changed");
  });
});

// ---------------------------------------------------------------------------
// 6. Global / Metadata Changes
// ---------------------------------------------------------------------------

describe("Global metadata changes", () => {
  it("6.1 change info.title → patch, 0 breaking, 1 safe documentation", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({ info: { title: "Renamed API", version: "1.0.0" } });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("info-title-changed");
    expect(body.data.compatReport.safeChanges[0].category).toBe("documentation");
  });

  it("6.5 add global security → major, 1 breaking structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({ security: [{ apiKey: [] }] });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("global-security-added");
    expect(body.compatReport.breakingChanges[0].category).toBe("structural");
  });

  it("6.6 remove global security → patch, 0 breaking, 1 safe structural", async () => {
    const specV1 = makeSpec({ security: [{ apiKey: [] }] });
    await pushSpec(app, { content: specV1, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: baseSpec, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("global-security-removed");
    expect(body.data.compatReport.safeChanges[0].category).toBe("documentation");
  });
});

// ---------------------------------------------------------------------------
// Combined classification sanity checks
// ---------------------------------------------------------------------------

describe("Combined classification", () => {
  it("structural safe + documentation → minor (structural wins)", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      info: { title: "Renamed API", version: "1.0.0" },
      paths: {
        ...JSON.parse(baseSpec).paths,
        "/payments/{id}/refunds": {
          get: {
            operationId: "getRefunds",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges.length).toBeGreaterThanOrEqual(2);
  });

  it("breaking + documentation → major (breaking wins)", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      info: { title: "Renamed API", version: "1.0.0" },
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
              { name: "currency", in: "query", required: true, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges.length).toBeGreaterThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// 7. Field-level Deprecation Lifecycle
// ---------------------------------------------------------------------------

describe("Field-level deprecation lifecycle", () => {
  it("7.1 mark query parameter as deprecated → minor, 0 breaking, 1 safe structural", async () => {
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
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
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
              { name: "expand", in: "query", required: false, schema: { type: "string" }, deprecated: true, "x-sunset": "2099-12-31" },
            ],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("param-deprecated");
    expect(body.data.compatReport.safeChanges[0].category).toBe("structural");
  });

  it("7.2 remove deprecated query parameter after sunset → major, 1 breaking structural (allowed)", async () => {
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("major");
    expect(body.data.compatReport.breakingChanges).toHaveLength(1);
    expect(body.data.compatReport.breakingChanges[0].rule).toBe("param-removed");
  });

  it("7.3 remove query parameter without deprecation → major, 1 breaking structural (blocked)", async () => {
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
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
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" }, amount: { type: "number" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("param-removed-without-deprecation");
  });

  it("7.4 mark response property as deprecated → minor, 0 breaking, 1 safe structural", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "number", deprecated: true, "x-sunset": "2099-12-31" },
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
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("response-property-deprecated");
    expect(body.data.compatReport.safeChanges[0].category).toBe("structural");
  });

  it("7.5 remove deprecated response property after sunset → major, 1 breaking structural (allowed)", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        amount: { type: "number", deprecated: true, "x-sunset": "2020-01-01" },
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
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
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
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("major");
    expect(body.data.compatReport.breakingChanges).toHaveLength(1);
    expect(body.data.compatReport.breakingChanges[0].rule).toBe("response-property-removed");
  });

  it("7.6 remove response property without deprecation → major, 1 breaking structural (blocked)", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: { id: { type: "string" } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("response-property-removed-without-deprecation");
  });

  it("7.7 mark request body property as deprecated → minor, 0 breaking, 1 safe structural", async () => {
    const specWithBody = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              description: "Payment payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      amount: { type: "number" },
                      currency: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    await pushSpec(app, { content: specWithBody, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              description: "Payment payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      amount: { type: "number" },
                      currency: { type: "string", deprecated: true, "x-sunset": "2099-12-31" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("request-body-property-deprecated");
    expect(body.data.compatReport.safeChanges[0].category).toBe("structural");
  });

  it("7.8 remove deprecated request body property after sunset → major, 1 breaking structural (allowed)", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              description: "Payment payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      amount: { type: "number" },
                      currency: { type: "string", deprecated: true, "x-sunset": "2020-01-01" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    await pushSpec(app, { content: specV1, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              description: "Payment payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      amount: { type: "number" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("major");
    expect(body.data.compatReport.breakingChanges).toHaveLength(1);
    expect(body.data.compatReport.breakingChanges[0].rule).toBe("request-body-property-removed");
  });

  it("7.9 remove request body property without deprecation → major, 1 breaking structural (blocked)", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              description: "Payment payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      amount: { type: "number" },
                      currency: { type: "string" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    await pushSpec(app, { content: specV1, name: "payments-api" });
    const specV2 = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              description: "Payment payload",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      amount: { type: "number" },
                    },
                  },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
    });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("request-body-property-removed-without-deprecation");
  });
});

// ---------------------------------------------------------------------------
// 8. $ref Resolution
// ---------------------------------------------------------------------------

describe("$ref resolution", () => {
  it("8.1 detects adding a property inside a $ref-ed response schema", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Payment: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Payment: {
            type: "object",
            properties: {
              id: { type: "string" },
              amount: { type: "number" },
            },
          },
        },
      },
    });

    await pushSpec(app, { content: specV1, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("patch");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("response-property-added");
  });

  it("8.2 detects removing a property inside a $ref-ed response schema", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Payment: {
            type: "object",
            properties: {
              id: { type: "string" },
              amount: { type: "number" },
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
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              "200": {
                description: "Payment details",
                content: {
                  "application/json": {
                    schema: { $ref: "#/components/schemas/Payment" },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Payment: {
            type: "object",
            properties: { id: { type: "string" } },
          },
        },
      },
    });

    await pushSpec(app, { content: specV1, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("response-property-removed-without-deprecation");
  });

  it("8.3 detects making a property required inside a $ref-ed request body schema", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreatePaymentRequest" },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
      components: {
        schemas: {
          CreatePaymentRequest: {
            type: "object",
            properties: {
              amount: { type: "number" },
            },
          },
        },
      },
    });

    const specV2 = makeSpec({
      paths: {
        "/payments": {
          post: {
            operationId: "createPayment",
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreatePaymentRequest" },
                },
              },
            },
            responses: { "201": { description: "Created" } },
          },
        },
      },
      components: {
        schemas: {
          CreatePaymentRequest: {
            type: "object",
            required: ["amount"],
            properties: {
              amount: { type: "number" },
            },
          },
        },
      },
    });

    await pushSpec(app, { content: specV1, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("request-body-property-now-required");
  });

  it("8.4 detects parameter type change via $ref to components/parameters", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ $ref: "#/components/parameters/PaymentId" }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {
        parameters: {
          PaymentId: {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        },
      },
    });

    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ $ref: "#/components/parameters/PaymentId" }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {
        parameters: {
          PaymentId: {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        },
      },
    });

    await pushSpec(app, { content: specV1, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(409);
    expect(body.compatReport.classification).toBe("major");
    expect(body.compatReport.breakingChanges).toHaveLength(1);
    expect(body.compatReport.breakingChanges[0].rule).toBe("param-type-changed");
  });

  it("8.5 detects adding a parameter via $ref", async () => {
    const specV1 = makeSpec({
      paths: {
        "/payments": {
          get: {
            operationId: "listPayments",
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {},
    });

    const specV2 = makeSpec({
      paths: {
        "/payments": {
          get: {
            operationId: "listPayments",
            parameters: [{ $ref: "#/components/parameters/Limit" }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
      components: {
        parameters: {
          Limit: {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer" },
          },
        },
      },
    });

    await pushSpec(app, { content: specV1, name: "payments-api" });
    const { res, body } = await pushSpec(app, { content: specV2, name: "payments-api" });
    expect(res.status).toBe(201);
    expect(body.data.compatReport.classification).toBe("minor");
    expect(body.data.compatReport.breakingChanges).toHaveLength(0);
    expect(body.data.compatReport.safeChanges).toHaveLength(1);
    expect(body.data.compatReport.safeChanges[0].rule).toBe("optional-request-param-added");
  });
});
