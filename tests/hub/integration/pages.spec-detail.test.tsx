import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { AuthProvider } from "hub/context/AuthContext";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { SpecExplorerProvider } from "hub/context/SpecExplorerContext";
import { SpecDetailPage } from "hub/pages/SpecDetailPage";
import type { Spec, PublicSpecVersion } from "core";

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/specs/payments-api"]}>
      <ConfigProvider>
        <AuthProvider>
          <ThemeProvider>
            <SpecExplorerProvider>
              <Routes>
                <Route path="/specs/:name" element={children} />
                <Route path="/specs/:name/versions/:semver" element={<LocationDisplay />} />
              </Routes>
            </SpecExplorerProvider>
          </ThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  global.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  cleanup();
});

describe("SpecDetailPage — /specs/:name", () => {
  test("shows loading skeleton while fetching", () => {
    global.fetch = (async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return new Response("{}", { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<SpecDetailPage />, { wrapper: Wrapper });

    expect(document.querySelector(".animate-pulse")).toBeTruthy();
  });

  test("redirects to latest version when loaded", async () => {
    const spec: Spec = {
      id: "1", name: "payments-api", type: "openapi" as const,
      description: "Payments service", owner: "platform-team",
      tags: ["payments", "public"], createdAt: new Date(), updatedAt: new Date(),
    };
    const versions: PublicSpecVersion[] = [
      { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date() },
    ];

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/versions")) {
        return new Response(JSON.stringify({ data: versions, pagination: { hasMore: false, limit: 10, offset: 0, total: 1 } }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { spec, latestVersion: versions[0] } }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<SpecDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe("/specs/payments-api/versions/1.0.0");
    });
  });

  test("shows error state when spec not found", async () => {
    global.fetch = (async () =>
      new Response(JSON.stringify({ error: "not_found", message: "Spec not found", statusCode: 404 }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })) as unknown as typeof globalThis.fetch;

    render(<SpecDetailPage />, { wrapper: Wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load spec/i)).toBeTruthy();
    });
  });
});
