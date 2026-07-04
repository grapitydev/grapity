import "../setup";
import { Providers } from "../test-utils";
import { beforeEach, describe, expect, test } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useSpecs } from "hub/hooks/useSpecs";
import { useSpec } from "hub/hooks/useSpec";
import { useVersions } from "hub/hooks/useVersions";
import { useVersion } from "hub/hooks/useVersion";
import { useCompatReport } from "hub/hooks/useCompatReport";
import { useSpecContent } from "hub/hooks/useSpecContent";
import type { Spec, SpecListItem, PublicSpecVersion, CompatReport } from "core";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <Providers>{children}</Providers>
    </MemoryRouter>
  );
}

function mockFetchJson(status: number, body: unknown) {
  global.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof globalThis.fetch;
}

function mockFetchText(status: number, body: string) {
  global.fetch = (async () =>
    new Response(body, {
      status,
      headers: { "Content-Type": "text/plain" },
    })) as unknown as typeof globalThis.fetch;
}

beforeEach(() => {
  global.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
});

describe("useSpecs", () => {
  test("starts loading then returns specs on success", async () => {
    const specs: SpecListItem[] = [
      { id: "1", name: "payments-api", type: "openapi" as const, tags: [], createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z"), latestVersion: { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date("2026-01-01T00:00:00Z") } },
    ];
    mockFetchJson(200, { data: specs });

    const { result } = renderHook(() => useSpecs(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.specs).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.specs).toMatchObject([{ id: "1", name: "payments-api", type: "openapi", tags: [] }]);
    expect(result.current.error).toBeNull();
  });

  test("returns error on failed fetch", async () => {
    mockFetchJson(500, { error: "internal_error", message: "Server failed", statusCode: 500 });

    const { result } = renderHook(() => useSpecs(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("Server failed");
  });

  test("refetches when filters change", async () => {
    mockFetchJson(200, { data: [] });

    const { result, rerender } = renderHook(
      (props: { type?: string }) => useSpecs({ type: props.type }),
      {
        wrapper,
        initialProps: { type: undefined } as { type?: string },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchJson(200, { data: [] });
    rerender({ type: "openapi" as const });

    expect(result.current.loading).toBe(true);
  });
});

describe("useSpec", () => {
  test("fetches spec and latest version", async () => {
    const spec: Spec = { id: "1", name: "payments-api", type: "openapi" as const, tags: [], createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") };
    const latestVersion: PublicSpecVersion = { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date("2026-01-01T00:00:00Z") };
    mockFetchJson(200, { data: { spec, latestVersion } });

    const { result } = renderHook(() => useSpec("payments-api"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.spec?.name).toBe("payments-api");
    expect(result.current.latestVersion?.semver).toBe("1.0.0");
  });

  test("handles error state", async () => {
    mockFetchJson(404, { error: "not_found", message: "Spec not found", statusCode: 404 });

    const { result } = renderHook(() => useSpec("missing"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.spec).toBeNull();
  });
});

describe("useVersions", () => {
  test("fetches version list with pagination", async () => {
    const versions: PublicSpecVersion[] = [
      { id: "v2", specId: "1", semver: "1.1.0", checksum: "def", isPrerelease: false, createdAt: new Date("2026-01-02T00:00:00Z") },
      { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date("2026-01-01T00:00:00Z") },
    ];
    mockFetchJson(200, { data: versions, pagination: { hasMore: false, limit: 10, offset: 0, total: 2 } });

    const { result } = renderHook(() => useVersions("payments-api"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.versions).toHaveLength(2);
    expect(result.current.pagination?.total).toBe(2);
  });
});

describe("useVersion", () => {
  test("fetches specific version", async () => {
    const version: PublicSpecVersion = { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date("2026-01-01T00:00:00Z") };
    mockFetchJson(200, { data: version });

    const { result } = renderHook(() => useVersion("payments-api", "1.0.0"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.version?.semver).toBe("1.0.0");
  });
});

describe("useCompatReport", () => {
  test("fetches compat report for a version", async () => {
    const report: CompatReport = {
      previousVersion: "1.0.0",
      classification: "minor",
      breakingChanges: [],
      safeChanges: [{ id: "1", rule: "endpoint-added", description: "Added GET /payments", path: "/payments", category: "structural" }],
    };
    mockFetchJson(200, { data: report });

    const { result } = renderHook(() => useCompatReport("payments-api", "1.1.0"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.report?.classification).toBe("minor");
    expect(result.current.report?.safeChanges).toHaveLength(1);
  });

  test("does not fetch when semver is empty", async () => {
    let fetchCalled = false;
    global.fetch = (async () => {
      fetchCalled = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    const { result } = renderHook(() => useCompatReport("payments-api", ""), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchCalled).toBe(false);
    expect(result.current.report).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test("does not fetch when enabled is false", async () => {
    let fetchCalled = false;
    global.fetch = (async () => {
      fetchCalled = true;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    const { result } = renderHook(() => useCompatReport("payments-api", "1.1.0", false), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchCalled).toBe(false);
    expect(result.current.report).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe("useSpecContent", () => {
  test("fetches raw spec content as yaml", async () => {
    mockFetchText(200, "openapi: 3.1.0");

    const { result } = renderHook(() => useSpecContent("payments-api", "1.0.0", "yaml"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.content).toBe("openapi: 3.1.0");
  });

  test("fetches raw spec content as json", async () => {
    mockFetchText(200, '{"openapi":"3.1.0"}');

    const { result } = renderHook(() => useSpecContent("payments-api", "1.0.0", "json"), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.content).toBe('{"openapi":"3.1.0"}');
  });

  test("refetches when format changes", async () => {
    mockFetchText(200, "openapi: 3.1.0");

    const { result, rerender } = renderHook(
      (props: { format: "json" | "yaml" }) => useSpecContent("payments-api", "1.0.0", props.format),
      { wrapper, initialProps: { format: "yaml" } }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    mockFetchText(200, '{"openapi":"3.1.0"}');
    rerender({ format: "json" });

    expect(result.current.loading).toBe(true);
  });
});
