import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import type { createApp } from "registry/server";

const baseSpec = makeSpec();

let app: ReturnType<typeof createApp>;
let reset: () => Promise<void>;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  const testApp = await createTestApp();
  app = testApp.app;
  reset = testApp.reset;
  cleanup = testApp.cleanup;
}, 300_000);

async function patchSpec(
  app: ReturnType<typeof createApp>,
  name: string,
  body: Record<string, unknown>
) {
  const res = await app.request(`/v1/specs/${name}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json().catch(() => null) };
}

describe("PATCH /v1/specs/:name", () => {
  beforeEach(async () => {
    await reset();
  });

  afterAll(async () => {
    await cleanup();
  });

  it("defaults new specs to private visibility", async () => {
    const { res, body } = await pushSpec(app, { content: baseSpec, name: "some-api" });
    expect(res.status).toBe(201);
    expect(body.data.spec.visibility).toBe("private");
  });

  it("creates a spec with public visibility when requested at push", async () => {
    const { res, body } = await pushSpec(app, {
      content: baseSpec,
      name: "some-api",
      visibility: "public",
    });
    expect(res.status).toBe(201);
    expect(body.data.spec.visibility).toBe("public");
  });

  it("updates visibility on an existing spec when supplied at push", async () => {
    await pushSpec(app, { content: baseSpec, name: "some-api" });

    const { res, body } = await pushSpec(app, {
      content: baseSpec,
      name: "some-api",
      visibility: "public",
    });
    expect(res.status).toBe(201);
    expect(body.data.spec.visibility).toBe("public");
  });

  it("keeps visibility unchanged across pushes when not supplied", async () => {
    await pushSpec(app, { content: baseSpec, name: "some-api", visibility: "public" });

    const { res, body } = await pushSpec(app, { content: baseSpec, name: "some-api" });
    expect(res.status).toBe(201);
    expect(body.data.spec.visibility).toBe("public");
  });

  it("updates visibility without creating a new version", async () => {
    await pushSpec(app, { content: baseSpec, name: "some-api" });

    const { res, body } = await patchSpec(app, "some-api", { visibility: "public" });
    expect(res.status).toBe(200);
    expect(body.data.spec.visibility).toBe("public");

    const versions = await app.request("/v1/specs/some-api/versions");
    const versionsBody = (await versions.json()) as { data: unknown[] };
    expect(versionsBody.data).toHaveLength(1);
  });

  it("returns the previous visibility in the audit trail", async () => {
    await pushSpec(app, { content: baseSpec, name: "some-api" });
    const { res } = await patchSpec(app, "some-api", { visibility: "public" });
    expect(res.status).toBe(200);

    const { body } = await patchSpec(app, "some-api", { visibility: "private" });
    expect(body.data.spec.visibility).toBe("private");
  });

  it("returns 404 for an unknown spec", async () => {
    const { res, body } = await patchSpec(app, "missing-api", { visibility: "public" });
    expect(res.status).toBe(404);
    expect(body.error).toBe("not_found");
  });

  it("rejects a missing visibility field", async () => {
    await pushSpec(app, { content: baseSpec, name: "some-api" });
    const { res, body } = await patchSpec(app, "some-api", {});
    expect(res.status).toBe(400);
    expect(body.error).toBe("bad_request");
  });

  it("rejects an unknown visibility value", async () => {
    await pushSpec(app, { content: baseSpec, name: "some-api" });
    const { res, body } = await patchSpec(app, "some-api", { visibility: "everyone" });
    expect(res.status).toBe(400);
    expect(body.error).toBe("bad_request");
  });
});
