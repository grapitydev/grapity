import "../setup";
import { Providers } from "../test-utils";
import { beforeEach, describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useApiClient } from "hub/api/client";
import type { Spec, PublicSpecVersion, CompatReport } from "core";

type FetchCall = { url: string; method: string };

let lastCall: FetchCall;

function mockFetchJson(status: number, body: unknown) {
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    lastCall = { url, method: "GET" };
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof globalThis.fetch;
}

function mockFetchText(status: number, body: string) {
  global.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    lastCall = { url, method: "GET" };
    return new Response(body, {
      status,
      headers: { "Content-Type": "text/plain" },
    });
  }) as typeof globalThis.fetch;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

const BASE = "";

beforeEach(() => {
  lastCall = { url: "", method: "" };
});

describe("listSpecs", () => {
  test("calls GET /v1/specs and returns specs array", async () => {
    const specs = [{ id: "1", name: "payments-api", type: "openapi" as const, tags: [], createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") }];
    mockFetchJson(200, { data: specs });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    const data = await result.current.listSpecs();

    expect(lastCall.url).toBe(`${BASE}/v1/specs`);
    expect(lastCall.method).toBe("GET");
    expect(data).toMatchObject([{ id: "1", name: "payments-api", type: "openapi", tags: [] }]);
  });

  test("appends type query param when provided", async () => {
    mockFetchJson(200, { data: [] });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    await result.current.listSpecs({ type: "openapi" });

    expect(lastCall.url).toBe(`${BASE}/v1/specs?type=openapi`);
  });

  test("appends owner query param when provided", async () => {
    mockFetchJson(200, { data: [] });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    await result.current.listSpecs({ owner: "platform-team" });

    expect(lastCall.url).toBe(`${BASE}/v1/specs?owner=platform-team`);
  });

  test("appends comma-joined tags query param when provided", async () => {
    mockFetchJson(200, { data: [] });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    await result.current.listSpecs({ tags: ["payments", "public"] });

    expect(lastCall.url).toBe(`${BASE}/v1/specs?tags=payments%2Cpublic`);
  });

  test("omits tags query param when array is empty", async () => {
    mockFetchJson(200, { data: [] });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    await result.current.listSpecs({ tags: [] });

    expect(lastCall.url).toBe(`${BASE}/v1/specs`);
  });
});

describe("getSpec", () => {
  test("calls GET /v1/specs/:name and returns spec data", async () => {
    const spec: Spec = { id: "1", name: "payments-api", type: "openapi", tags: [], createdAt: new Date(), updatedAt: new Date() };
    mockFetchJson(200, { data: { spec, latestVersion: null } });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    const data = await result.current.getSpec("payments-api");

    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api`);
    expect(data.spec.name).toBe("payments-api");
  });

  test("throws with server error message on non-ok response", async () => {
    mockFetchJson(404, { error: "not_found", message: "Spec not found", statusCode: 404 });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    await expect(result.current.getSpec("unknown")).rejects.toThrow("Spec not found");
  });
});

describe("listVersions", () => {
  test("calls GET /v1/specs/:name/versions and returns paginated response", async () => {
    mockFetchJson(200, { data: [], pagination: { hasMore: false, limit: 10, offset: 0, total: 0 } });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    const data = await result.current.listVersions("payments-api");

    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions`);
    expect(data.pagination.total).toBe(0);
  });
});

describe("getVersion", () => {
  test("calls GET /v1/specs/:name/versions/:semver", async () => {
    const version: PublicSpecVersion = { id: "1", specId: "1", semver: "1.2.0", checksum: "abc", isPrerelease: false, createdAt: new Date() };
    mockFetchJson(200, { data: version });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    const data = await result.current.getVersion("payments-api", "1.2.0");

    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions/1.2.0`);
    expect(data.semver).toBe("1.2.0");
  });
});

describe("getCompatReport", () => {
  test("calls GET /v1/specs/:name/compat/:semver", async () => {
    const report: CompatReport = { previousVersion: "1.0.0", classification: "minor", breakingChanges: [], safeChanges: [] };
    mockFetchJson(200, { data: report });

    const { result } = renderHook(() => useApiClient(), { wrapper });
    const data = await result.current.getCompatReport("payments-api", "1.1.0");

    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/compat/1.1.0`);
    expect(data.classification).toBe("minor");
  });
});

describe("getSpecContent", () => {
  test("calls GET /v1/specs/:name/versions/:semver/spec.yaml and returns raw text", async () => {
    mockFetchText(200, "openapi: 3.1.0");

    const { result } = renderHook(() => useApiClient(), { wrapper });
    const data = await result.current.getSpecContent("payments-api", "1.0.0", "yaml");

    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions/1.0.0/spec.yaml`);
    expect(data).toBe("openapi: 3.1.0");
  });

  test("calls GET /v1/specs/:name/versions/:semver/spec.json and returns raw text", async () => {
    mockFetchText(200, '{"openapi":"3.1.0"}');

    const { result } = renderHook(() => useApiClient(), { wrapper });
    const data = await result.current.getSpecContent("payments-api", "1.0.0", "json");

    expect(lastCall.url).toBe(`${BASE}/v1/specs/payments-api/versions/1.0.0/spec.json`);
    expect(data).toBe('{"openapi":"3.1.0"}');
  });
});

describe("error handling", () => {
  test("falls back to status code message when server error has no message", async () => {
    mockFetchJson(500, {});

    const { result } = renderHook(() => useApiClient(), { wrapper });
    await expect(result.current.listSpecs()).rejects.toThrow("Request failed: 500");
  });
});
