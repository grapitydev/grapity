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

describe("Canonical normalization on push", () => {
  it("stores OpenAPI spec with alphabetically sorted keys", async () => {
    const spec = JSON.stringify({
      z: 1,
      a: 2,
      info: { z: 1, a: 2 },
      openapi: "3.1.0",
    });

    const { res } = await pushSpec(app, { content: spec, name: "ordered-api" });
    expect(res.status).toBe(201);

    const stored = await app.request("/v1/specs/ordered-api/spec.json");
    const body = await stored.json();
    expect(Object.keys(body)).toEqual(["openapi", "info", "a", "z"]);
    expect(Object.keys(body.info)).toEqual(["a", "z"]);
  });

  it("produces identical checksums for same spec with different key ordering", async () => {
    const spec1 = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "API", version: "1.0" },
      paths: {
        "/users": { get: { operationId: "getUsers", responses: { "200": { description: "ok" } } } },
      },
    });

    const spec2 = JSON.stringify({
      paths: {
        "/users": { get: { operationId: "getUsers", responses: { "200": { description: "ok" } } } },
      },
      info: { version: "1.0", title: "API" },
      openapi: "3.1.0",
    });

    const { res: res1, body: body1 } = await pushSpec(app, { content: spec1, name: "same-api" });
    expect(res1.status).toBe(201);
    const checksum1 = body1.data.version.checksum;

    const { res: res2, body: body2 } = await pushSpec(app, { content: spec2, name: "same-api" });
    expect(res2.status).toBe(201); // No changes detected, patch bump
    expect(body2.data.version.semver).toBe("1.0.1");
    expect(body2.data.version.checksum).toBe(checksum1);
  });

  it("second push with identical content bumps patch version", async () => {
    const base = makeSpec();
    const { res: res1 } = await pushSpec(app, { content: base, name: "payments-api" });
    expect(res1.status).toBe(201);

    const { res: res2, body: body2 } = await pushSpec(app, { content: base, name: "payments-api" });
    expect(res2.status).toBe(201);
    expect(body2.data.version.semver).toBe("1.0.1");
  });

  it("preserves array order after normalization", async () => {
    const spec = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "API", version: "1.0" },
      servers: [
        { url: "https://prod.example.com", description: "Production" },
        { url: "https://staging.example.com", description: "Staging" },
      ],
      paths: {
        "/users": { get: { operationId: "getUsers", responses: { "200": { description: "ok" } } } },
      },
    });

    const { res } = await pushSpec(app, { content: spec, name: "servers-api" });
    expect(res.status).toBe(201);

    const stored = await app.request("/v1/specs/servers-api/spec.json");
    const body = await stored.json();
    expect(body.servers).toHaveLength(2);
    expect(body.servers[0].url).toBe("https://prod.example.com");
    expect(body.servers[1].url).toBe("https://staging.example.com");
  });

  it("normalizes nested schema properties alphabetically", async () => {
    const spec = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "API", version: "1.0" },
      paths: {
        "/users": {
          get: {
            operationId: "getUsers",
            responses: {
              "200": {
                description: "ok",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        z: { type: "string" },
                        a: { type: "string" },
                        m: { type: "string" },
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

    const { res } = await pushSpec(app, { content: spec, name: "schema-api" });
    expect(res.status).toBe(201);

    const stored = await app.request("/v1/specs/schema-api/spec.json");
    const body = await stored.json();
    const props = body.paths["/users"].get.responses["200"].content["application/json"].schema.properties;
    expect(Object.keys(props)).toEqual(["a", "m", "z"]);
  });
});
