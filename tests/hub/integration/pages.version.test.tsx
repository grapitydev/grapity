import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { AuthProvider } from "hub/context/AuthContext";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { SpecExplorerProvider } from "hub/context/SpecExplorerContext";
import { VersionPage } from "hub/pages/VersionPage";
import type { PublicSpecVersion, CompatReport, Spec } from "core";

const TEST_SPEC: Spec = {
  id: "1", name: "payments-api", type: "openapi" as const,
  description: "Payments service", owner: "platform-team",
  tags: ["payments", "public"], createdAt: new Date(), updatedAt: new Date(),
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={[`/specs/payments-api/versions/1.0.0`]}>
      <ConfigProvider>
        <AuthProvider>
          <ThemeProvider>
            <SpecExplorerProvider>
              <Routes>
                <Route path="/specs/:name/versions/:semver" element={children} />
              </Routes>
            </SpecExplorerProvider>
          </ThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </MemoryRouter>
  );
}

const OPENAPI_JSON = JSON.stringify({
  openapi: "3.1.0",
  info: { title: "Test API", version: "1.0.0" },
  servers: [{ url: "https://api.example.com" }],
  components: {
    schemas: {
      Payment: {
        type: "object",
        title: "Payment",
        description: "A payment object",
        properties: {
          id: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string" },
          status: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    "/v1/accounts": {
      get: {
        summary: "List all accounts",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer" }, required: false },
          { name: "offset", in: "query", schema: { type: "integer" }, required: false },
        ],
        responses: {
          "200": {
            description: "List of accounts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { type: "object", properties: { id: { type: "string" } } },
                    },
                  },
                },
                examples: {
                  default: {
                    value: {
                      data: [{ id: "acc_123" }],
                    },
                    summary: "Default",
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: "Create a new account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email"],
                properties: {
                  name: { type: "string", description: "Account holder name" },
                  email: { type: "string", format: "email", description: "Contact email" },
                  metadata: {
                    type: "object",
                    description: "Custom metadata",
                    properties: {
                      plan: { type: "string" },
                      tier: { type: "string" },
                    },
                  },
                },
              },
                examples: {
                  default: {
                    value: {
                      name: "Acme Corp",
                      email: "admin@acme.com",
                      metadata: { plan: "enterprise", tier: "gold" },
                    },
                    summary: "Default",
                  },
                },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                },
                examples: {
                  default: {
                    value: {
                      id: "acc_new456",
                      name: "Acme Corp",
                      email: "admin@acme.com",
                    },
                    summary: "Default",
                  },
                },
              },
            },
          },
          "400": {
            description: "Invalid request",
          },
        },
      },
    },
    "/v1/accounts/{id}": {
      get: {
        summary: "Retrieve an account",
        parameters: [
          { name: "id", in: "path", schema: { type: "string" }, required: true },
        ],
        responses: {
          "200": {
            description: "Account details",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Payment",
                },
                examples: {
                  default: {
                    value: {
                      id: "pay_123",
                      amount: 99.99,
                      currency: "USD",
                      status: "completed",
                      createdAt: "2026-01-15T10:30:00Z",
                    },
                    summary: "Default",
                  },
                },
              },
            },
          },
        },
      },
    },
    "/v1/payments": {
      get: {
        summary: "List all payments",
        parameters: [],
        responses: {
          "200": {
            description: "List of payments",
          },
        },
      },
    },
  },
});

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  cleanup();
  global.fetch = originalFetch;
});

describe("VersionPage — /specs/:name/versions/:semver", () => {
  test("renders spec metadata and tabs", async () => {
    const spec: Spec = {
      id: "1", name: "payments-api", type: "openapi" as const,
      description: "Payments service", owner: "platform-team",
      tags: ["payments", "public"], createdAt: new Date(), updatedAt: new Date(),
    };
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("payments-api")).toBeTruthy();
      expect(screen.getByText("Payments service")).toBeTruthy();
      expect(screen.getByText("platform-team")).toBeTruthy();
    });
  });

  test("renders all tabs including Versions and Compare", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeTruthy();
      expect(screen.getByText(/Changelog/i)).toBeTruthy();
      expect(screen.getByText(/Versions/i)).toBeTruthy();
      expect(screen.getByText(/Compare/i)).toBeTruthy();
      expect(screen.getByText(/Raw Spec/i)).toBeTruthy();
    });
  });

  test("renders parsed OpenAPI endpoints in Overview tab", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("List all accounts")).toBeTruthy();
      expect(screen.getByText("Create a new account")).toBeTruthy();
    });
  });

  test("renders Versions tab with timeline", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Versions/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/Versions/i));

    await waitFor(() => {
      expect(screen.getByText(/Version History/i)).toBeTruthy();
    });
  });

  test("renders request body properties with nesting", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Request Body")).toBeTruthy();
      expect(screen.getByText("metadata")).toBeTruthy();
      expect(screen.getByText("plan")).toBeTruthy();
      expect(screen.getByText("tier")).toBeTruthy();
    });
  });

  test("renders response schemas", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getAllByText("201").length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText("Account created").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("400")).toBeTruthy();
      expect(screen.getByText("Invalid request")).toBeTruthy();
    });
  });

  test("resolves $ref in response schemas", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/amount/);
      expect(document.body.textContent).toMatch(/currency/);
      expect(document.body.textContent).toMatch(/status/);
      expect(document.body.textContent).toMatch(/createdAt/);
    });
  });

  test("renders example request curl command", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/curl -X POST/i);
      expect(document.body.textContent).toMatch(/https:\/\/api\.example\.com\/v1\/accounts/i);
    });
  });

  test("renders example responses", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/acc_123/i);
      expect(document.body.textContent).toMatch(/acc_new456/i);
    });
  });

  test("sidebar shows endpoint groups on VersionPage", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText("Accounts")).toBeTruthy();
      expect(screen.getByText("Payments")).toBeTruthy();
    });
  });

  test("renders deprecated endpoints, parameters, and properties with badges", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    const DEPRECATED_OPENAPI_JSON = JSON.stringify({
      openapi: "3.1.0",
      info: { title: "Inventory API", version: "1.3.0" },
      servers: [{ url: "https://api.example.com" }],
      paths: {
        "/items/{itemId}": {
          get: {
            summary: "Retrieve an item (v2)",
            parameters: [
              { name: "itemId", in: "path", required: true, schema: { type: "integer" } },
              { name: "expand", in: "query", required: false, schema: { type: "string" }, deprecated: true, "x-sunset": "2024-01-01" },
            ],
            responses: {
              "200": {
                description: "Item details",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        itemId: { type: "integer" },
                        name: { type: "string" },
                        warehouse: { type: "string", deprecated: true, "x-sunset": "2024-01-01" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        "/items/{id}": {
          get: {
            summary: "Retrieve an item (legacy)",
            deprecated: true,
            "x-sunset": "2024-01-01",
            parameters: [
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              "200": {
                description: "Item details (legacy)",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
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

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(DEPRECATED_OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\ninfo:\n  title: Inventory API\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Retrieve an item \(v2\)/);
    });

    // Endpoint-level deprecation
    expect(document.body.textContent).toMatch(/This endpoint is deprecated/);
    expect(document.body.textContent).toMatch(/It will be removed on 2024-01-01/);

    // Deprecated endpoints sorted to bottom (GET /items/{itemId} before GET /items/{id})
    const content = document.body.textContent;
    const idxV2 = content.indexOf("Retrieve an item (v2)");
    const idxLegacy = content.indexOf("Retrieve an item (legacy)");
    expect(idxV2).toBeLessThan(idxLegacy);

    // Parameter-level deprecation
    expect(document.body.textContent).toMatch(/expand.*Deprecated/);
    expect(document.body.textContent).toMatch(/Sunset passed: 2024-01-01/);

    // Property-level deprecation
    expect(document.body.textContent).toMatch(/warehouse.*Deprecated/);
  });

  test("switches to YAML tab without skeleton flash", async () => {
    const version: PublicSpecVersion = {
      id: "v1", specId: "1", semver: "1.0.0", checksum: "abc",
      isPrerelease: false, createdAt: new Date(),
      compatibility: { classification: "initial", previousVersion: "", breakingChanges: [], safeChanges: [] },
    };

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/compat/")) {
        const report: CompatReport = { previousVersion: "", classification: "initial", breakingChanges: [], safeChanges: [] };
        return new Response(JSON.stringify({ data: report }), { status: 200 });
      }
      if (url.includes("/spec.json")) {
        return new Response(OPENAPI_JSON, { status: 200 });
      }
      if (url.includes("/spec.yaml")) {
        return new Response("openapi: 3.1.0\ninfo:\n  title: Test API\n", { status: 200 });
      }
      if (url.includes("/versions") && !url.includes("/versions/")) {
        return new Response(JSON.stringify({ data: [version], pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      if (url.includes("/specs/payments-api") && !url.includes("/versions") && !url.includes("/compat") && !url.includes("/spec.")) {
        return new Response(JSON.stringify({ data: { spec: TEST_SPEC, latestVersion: version } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: version }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<VersionPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Raw Spec/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/Raw Spec/i));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Test API/i);
    });

    fireEvent.click(screen.getByText("YAML"));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/openapi: 3\.1\.0/);
    });
  });
});
