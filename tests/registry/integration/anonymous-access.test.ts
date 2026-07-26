import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import { fetchToken, startKeycloak, REALM } from "./keycloak";
import type { createApp } from "registry/server";

const baseSpec = makeSpec();

let app: ReturnType<typeof createApp>;
let reset: () => Promise<void>;
let cleanup: () => Promise<void>;

let keycloakServerUrl: string;
let writeToken: string;
let readToken: string;

beforeAll(async () => {
  if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
    return;
  }

  const keycloak = await startKeycloak();
  keycloakServerUrl = keycloak.serverUrl;

  writeToken = await fetchToken(keycloakServerUrl, "grapity-cli", "grapity-cli-secret");
  readToken = writeToken;

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

describe("Anonymous access with Keycloak auth enabled", () => {
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

  it("lists only public specs to anonymous callers", async () => {
    await pushSpec(app, { content: baseSpec, name: "private-api" }, writeToken);
    await pushSpec(
      app,
      { content: baseSpec, name: "public-api", visibility: "public" },
      writeToken
    );

    const res = await app.request("/v1/specs", { method: "GET" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { name: string }[] };
    expect(body.data.map((s) => s.name)).toEqual(["public-api"]);
  });

  it("reads a public spec anonymously", async () => {
    await pushSpec(
      app,
      { content: baseSpec, name: "public-api", visibility: "public" },
      writeToken
    );

    const res = await app.request("/v1/specs/public-api", { method: "GET" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { spec: { name: string; visibility: string } } };
    expect(body.data.spec.name).toBe("public-api");
    expect(body.data.spec.visibility).toBe("public");
  });

  it("returns 404 for a private spec to anonymous callers without leaking existence", async () => {
    await pushSpec(app, { content: baseSpec, name: "private-api" }, writeToken);

    const res = await app.request("/v1/specs/private-api", { method: "GET" });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });

  it("returns 404 for unknown specs to anonymous callers identically", async () => {
    const res = await app.request("/v1/specs/never-existed", { method: "GET" });
    expect(res.status).toBe(404);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("not_found");
  });

  it("serves versions, spec content, and compat reports of public specs anonymously", async () => {
    await pushSpec(
      app,
      { content: baseSpec, name: "public-api", visibility: "public" },
      writeToken
    );

    const versions = await app.request("/v1/specs/public-api/versions", { method: "GET" });
    expect(versions.status).toBe(200);

    const specJson = await app.request("/v1/specs/public-api/spec.json", { method: "GET" });
    expect(specJson.status).toBe(200);

    const compat = await app.request("/v1/specs/public-api/compat/1.0.0", { method: "GET" });
    expect(compat.status).toBe(200);
  });

  it("returns 404 for versions and spec content of private specs anonymously", async () => {
    await pushSpec(app, { content: baseSpec, name: "private-api" }, writeToken);

    const versions = await app.request("/v1/specs/private-api/versions", { method: "GET" });
    expect(versions.status).toBe(404);

    const specJson = await app.request("/v1/specs/private-api/spec.json", { method: "GET" });
    expect(specJson.status).toBe(404);
  });

  it("still requires auth for writes", async () => {
    const res = await app.request("/v1/specs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: baseSpec, name: "anon-api" }),
    });
    expect(res.status).toBe(401);
  });

  it("still requires auth to update visibility", async () => {
    await pushSpec(
      app,
      { content: baseSpec, name: "public-api", visibility: "public" },
      writeToken
    );

    const res = await app.request("/v1/specs/public-api", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: "private" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects invalid tokens even for public specs", async () => {
    await pushSpec(
      app,
      { content: baseSpec, name: "public-api", visibility: "public" },
      writeToken
    );

    const res = await app.request("/v1/specs/public-api", {
      method: "GET",
      headers: { Authorization: "Bearer not-a-real-token" },
    });
    expect(res.status).toBe(401);
  });

  it("authenticated callers still see everything", async () => {
    await pushSpec(app, { content: baseSpec, name: "private-api" }, writeToken);
    await pushSpec(
      app,
      { content: baseSpec, name: "public-api", visibility: "public" },
      writeToken
    );

    const res = await app.request("/v1/specs", {
      method: "GET",
      headers: { Authorization: `Bearer ${readToken}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { name: string }[] };
    expect(body.data.map((s) => s.name).sort()).toEqual(["private-api", "public-api"]);
  });

  it("opens and closes anonymous access when visibility changes via PATCH", async () => {
    await pushSpec(app, { content: baseSpec, name: "some-api" }, writeToken);

    const before = await app.request("/v1/specs/some-api", { method: "GET" });
    expect(before.status).toBe(404);

    const publish = await app.request("/v1/specs/some-api", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${writeToken}`,
      },
      body: JSON.stringify({ visibility: "public" }),
    });
    expect(publish.status).toBe(200);

    const after = await app.request("/v1/specs/some-api", { method: "GET" });
    expect(after.status).toBe(200);

    const unpublish = await app.request("/v1/specs/some-api", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${writeToken}`,
      },
      body: JSON.stringify({ visibility: "private" }),
    });
    expect(unpublish.status).toBe(200);

    const closed = await app.request("/v1/specs/some-api", { method: "GET" });
    expect(closed.status).toBe(404);
  });
});
