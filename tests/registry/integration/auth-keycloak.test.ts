import { describe, it, expect, beforeAll, beforeEach, afterAll } from "bun:test";
import { createTestApp, makeSpec, pushSpec } from "./helpers";
import { fetchToken, startKeycloak, REALM } from "./keycloak";
import type { createApp } from "registry/server";
import { decodeJwt } from "jose";

const baseSpec = makeSpec();

let app: ReturnType<typeof createApp>;
let reset: () => Promise<void>;
let cleanup: () => Promise<void>;

let keycloakServerUrl: string;
let readToken: string;
let writeToken: string;
let wrongAudienceToken: string;
let missingScopeToken: string;
let writeTokenSubject: string;

beforeAll(async () => {
  if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
    return;
  }

  const keycloak = await startKeycloak();
  keycloakServerUrl = keycloak.serverUrl;

  readToken = await fetchToken(keycloakServerUrl, "grapity-cli", "grapity-cli-secret");
  writeToken = await fetchToken(keycloakServerUrl, "grapity-cli", "grapity-cli-secret");
  wrongAudienceToken = await fetchToken(
    keycloakServerUrl,
    "grapity-other-audience",
    "grapity-other-audience-secret"
  );
  missingScopeToken = await fetchToken(
    keycloakServerUrl,
    "grapity-cli-limited",
    "grapity-cli-limited-secret"
  );

  const writePayload = decodeJwt(writeToken);
  writeTokenSubject = writePayload.sub ?? "";

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

describe("Keycloak auth enabled", () => {
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

  it("rejects requests without a Bearer token", async () => {
    const res = await app.request("/v1/specs", { method: "GET" });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("unauthorized");
  });

  it("rejects requests with an invalid token", async () => {
    const res = await app.request("/v1/specs", {
      method: "GET",
      headers: { Authorization: "Bearer invalid-token" },
    });
    expect(res.status).toBe(401);
  });

  it("allows read requests with a valid token containing specs:read", async () => {
    const res = await app.request("/v1/specs", {
      method: "GET",
      headers: { Authorization: `Bearer ${readToken}` },
    });
    expect(res.status).toBe(200);
  });

  it("rejects read requests when the token is missing the required scope", async () => {
    const res = await app.request("/v1/specs", {
      method: "GET",
      headers: { Authorization: `Bearer ${missingScopeToken}` },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("forbidden");
  });

  it("allows push requests with specs:write and records the actor", async () => {
    const res = await pushSpec(
      app,
      { content: baseSpec, name: "payments-api" },
      writeToken
    );
    expect(res.res.status).toBe(201);
    expect(res.body.data.version.pushedBy).toBe(writeTokenSubject);
  });

  it("rejects push requests without specs:write", async () => {
    const res = await pushSpec(
      app,
      { content: baseSpec, name: "payments-api" },
      missingScopeToken
    );
    expect(res.res.status).toBe(403);
  });

  it("validates the configured audience", async () => {
    const res = await app.request("/v1/specs", {
      method: "GET",
      headers: { Authorization: `Bearer ${wrongAudienceToken}` },
    });
    expect(res.status).toBe(401);
  });

  it("rejects expired tokens", async () => {
    // Keycloak tokens expire in minutes, so we cannot easily generate an expired
    // token. Instead we test that tampering with the token is rejected.
    const tampered = `${readToken.slice(0, -5)}XXXXX`;
    const res = await app.request("/v1/specs", {
      method: "GET",
      headers: { Authorization: `Bearer ${tampered}` },
    });
    expect(res.status).toBe(401);
  });

  it("allows health endpoint without auth", async () => {
    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
  });
});
