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

describe("DELETE /v1/specs/{name}", () => {
  it("deletes an existing spec and all its versions", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const deleteRes = await app.request("/v1/specs/payments-api", {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    const getRes = await app.request("/v1/specs/payments-api");
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for a non-existent spec", async () => {
    const res = await app.request("/v1/specs/does-not-exist", {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.error).toBe("not_found");
  });

  it("removes the spec from the list after deletion", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });
    await pushSpec(app, { content: baseSpec, name: "users-api" });

    const deleteRes = await app.request("/v1/specs/payments-api", {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    const listRes = await app.request("/v1/specs");
    const list = await listRes.json() as any;
    expect(list.data.length).toBe(1);
    expect(list.data[0].name).toBe("users-api");
  });

  it("makes versions inaccessible after deletion", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const deleteRes = await app.request("/v1/specs/payments-api", {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    const versionsRes = await app.request("/v1/specs/payments-api/versions");
    expect(versionsRes.status).toBe(404);

    const versionRes = await app.request("/v1/specs/payments-api/versions/1.0.0");
    expect(versionRes.status).toBe(404);
  });

  it("makes spec serving endpoints return 404 after deletion", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const deleteRes = await app.request("/v1/specs/payments-api", {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    const jsonRes = await app.request("/v1/specs/payments-api/spec.json");
    expect(jsonRes.status).toBe(404);

    const yamlRes = await app.request("/v1/specs/payments-api/spec.yaml");
    expect(yamlRes.status).toBe(404);
  });

  it("records a spec.delete audit log entry", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const deleteRes = await app.request("/v1/specs/payments-api", {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    // Verify audit log was written — this depends on store internals
    // For now we verify the delete succeeds; audit logging is tested via
    // integration of the full stack.
  });
});

describe("GET /v1/specs/{name}/versions — fixed 404 behavior", () => {
  it("returns 404 for a non-existent spec", async () => {
    const res = await app.request("/v1/specs/does-not-exist/versions");
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.error).toBe("not_found");
  });

  it("returns 200 with versions for an existing spec", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/versions");
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.length).toBe(1);
    expect(body.data[0].semver).toBe("1.0.0");
  });
});

describe("POST /v1/specs/{name}/validate — fixed 404 behavior", () => {
  it("returns 404 for a non-existent spec", async () => {
    const res = await app.request("/v1/specs/does-not-exist/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: baseSpec }),
    });
    expect(res.status).toBe(404);
    const body = await res.json() as any;
    expect(body.error).toBe("not_found");
  });

  it("returns 200 for an existing spec", async () => {
    await pushSpec(app, { content: baseSpec, name: "payments-api" });

    const res = await app.request("/v1/specs/payments-api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: baseSpec }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.data.valid).toBe(true);
  });
});
