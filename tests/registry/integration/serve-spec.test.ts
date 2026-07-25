import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import yaml from "js-yaml";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "registry/server";

const baseSpec = makeSpec();

const specWithNewEndpoint = makeSpec({
  paths: {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "ok" } },
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

describe("Scenario 14: Spec serving", () => {
  it("14A: GET /spec.json returns the latest spec as a parsed JSON object", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/spec.json");
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.openapi).toBeDefined();
    expect(body.paths).toBeDefined();
    expect(body.paths["/payments/{id}"]).toBeDefined();
  });

  it("14B: GET /spec.yaml returns the latest spec as YAML text", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/spec.yaml");
    const text = await res.text();
    const parsed = yaml.load(text) as any;

    expect(res.status).toBe(200);
    expect(parsed.openapi).toBeDefined();
    expect(parsed.paths["/payments/{id}"]).toBeDefined();
  });

  it("14C: GET /versions/:semver/spec.json returns a specific version", async () => {
    const specV2 = makeSpec({
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
        "/payments/{id}/refunds": {
          get: {
            operationId: "getRefunds",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });

    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specV2, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions/1.0.0/spec.json");
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.paths["/payments/{id}/refunds"]).toBeUndefined();
  });

  it("14D: GET /versions/:semver/spec.yaml returns a specific version as YAML", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions/1.0.0/spec.yaml");
    const text = await res.text();
    const parsed = yaml.load(text) as any;

    expect(res.status).toBe(200);
    expect(parsed.paths["/payments/{id}"]).toBeDefined();
  });

  it("14E: spec pushed as JSON can be fetched as YAML (format conversion)", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const jsonRes = await app.request("/v1/specs/payments-api/spec.json");
    const yamlRes = await app.request("/v1/specs/payments-api/spec.yaml");

    const jsonBody = await jsonRes.json() as any;
    const yamlParsed = yaml.load(await yamlRes.text()) as any;

    expect(jsonBody.paths["/payments/{id}"]).toBeDefined();
    expect(yamlParsed.paths["/payments/{id}"]).toBeDefined();
    expect(JSON.stringify(jsonBody)).toBe(JSON.stringify(yamlParsed));
  });

  it("14F: correct Content-Type for JSON (OpenAPI)", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/spec.json");

    expect(res.headers.get("content-type")).toContain("application/vnd.oai.openapi+json");
  });

  it("14G: correct Content-Type for YAML (OpenAPI)", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/spec.yaml");

    expect(res.headers.get("content-type")).toContain("application/vnd.oai.openapi+yaml");
  });

  it("14H: returns 404 for unknown spec", async () => {
    const res = await app.request("/v1/specs/does-not-exist/spec.json");
    expect(res.status).toBe(404);
  });

  it("14I: returns 404 for unknown version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions/9.9.9/spec.json");
    expect(res.status).toBe(404);
  });

  it("14M: includes Grapity-Resolved-Version header for latest spec", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/spec.json");

    expect(res.status).toBe(200);
    expect(res.headers.get("Grapity-Resolved-Version")).toBe("1.0.0");
  });

  it("14N: includes Grapity-Resolved-Version header for specific version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions/1.0.0/spec.json");

    expect(res.status).toBe(200);
    expect(res.headers.get("Grapity-Resolved-Version")).toBe("1.0.0");
  });

  it("14O: does not include Grapity-Resolved-Version header on 404", async () => {
    const res = await app.request("/v1/specs/does-not-exist/spec.json");

    expect(res.status).toBe(404);
    expect(res.headers.get("Grapity-Resolved-Version")).toBeNull();
  });

  it("14J: GET /v1/specs/:name response does not include content field", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api");
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.latestVersion?.content).toBeUndefined();
  });

  it("14K: GET /v1/specs/:name/versions/:semver response does not include content field", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions/1.0.0");
    const body = await res.json() as any;

    expect(res.status).toBe(200);
    expect(body.data.version?.content).toBeUndefined();
  });

  it("14L: GET /v1/specs/:name/versions response does not include content field on any version", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: specWithNewEndpoint, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions");
    const versions = await res.json() as any;

    expect(res.status).toBe(200);
    expect(versions.data.length).toBe(2);
    versions.data.forEach((v: any) => expect(v.content).toBeUndefined());
  });

  it("14P: served spec document carries the registry-assigned version in info.version", async () => {
    const spec = makeSpec({ info: { title: "Test API", version: "0.0.0" } });
    await pushSpec(app, { content: spec, name: "payments-api" });

    const jsonRes = await app.request("/v1/specs/payments-api/spec.json");
    const jsonBody = await jsonRes.json() as any;
    expect(jsonRes.status).toBe(200);
    expect(jsonBody.info.version).toBe("1.0.0");

    const yamlRes = await app.request("/v1/specs/payments-api/spec.yaml");
    const yamlBody = yaml.load(await yamlRes.text()) as any;
    expect(yamlRes.status).toBe(200);
    expect(yamlBody.info.version).toBe("1.0.0");
  });

  it("14Q: each served version carries its own assigned version regardless of the pushed info.version", async () => {
    const v1 = makeSpec({ info: { title: "Test API", version: "0.0.0" } });
    const v2 = makeSpec({
      info: { title: "Test API", version: "0.0.0" },
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
        "/payments/{id}/refunds": {
          get: {
            operationId: "getRefunds",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });

    await pushSpec(app, { content: v1, name: "payments-api" });
    const { body: pushBody } = await pushSpec(app, { content: v2, name: "payments-api" });
    expect(pushBody.data.version.semver).toBe("1.1.0");

    const resV1 = await app.request("/v1/specs/payments-api/versions/1.0.0/spec.json");
    expect(resV1.status).toBe(200);
    expect((await resV1.json() as any).info.version).toBe("1.0.0");

    const resV2 = await app.request("/v1/specs/payments-api/versions/1.1.0/spec.json");
    expect(resV2.status).toBe(200);
    expect((await resV2.json() as any).info.version).toBe("1.1.0");

    const yamlV2 = await app.request("/v1/specs/payments-api/versions/1.1.0/spec.yaml");
    expect(yamlV2.status).toBe(200);
    expect((yaml.load(await yamlV2.text()) as any).info.version).toBe("1.1.0");
  });

  it("14R: AsyncAPI documents are stamped with the assigned version", async () => {
    const asyncApiSpec = JSON.stringify({
      asyncapi: "2.6.0",
      info: { title: "Events API", version: "0.0.0" },
      channels: {},
    });

    const { res: pushRes } = await pushSpec(app, { content: asyncApiSpec, name: "events-api", type: "asyncapi" });
    expect(pushRes.status).toBe(201);

    const res = await app.request("/v1/specs/events-api/spec.json");
    const body = await res.json() as any;
    expect(res.status).toBe(200);
    expect(body.info.version).toBe("1.0.0");
  });

  it("14S: compat report does not include an info-version-changed entry", async () => {
    const v1 = makeSpec({ info: { title: "Test API", version: "0.0.0" } });
    const v2 = makeSpec({
      info: { title: "Test API", version: "0.0.0" },
      paths: {
        "/payments/{id}": {
          get: {
            operationId: "getPayment",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
        "/payments/{id}/refunds": {
          get: {
            operationId: "getRefunds",
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: { "200": { description: "ok" } },
          },
        },
      },
    });

    await pushSpec(app, { content: v1, name: "payments-api" });
    const { body } = await pushSpec(app, { content: v2, name: "payments-api" });

    const rules = (body.data.compatReport.safeChanges as any[]).map((c) => c.rule);
    expect(rules).not.toContain("info-version-changed");
  });
});
