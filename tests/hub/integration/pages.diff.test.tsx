import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { AuthProvider } from "hub/context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { DiffPage } from "hub/pages/DiffPage";
import type { PublicSpecVersion } from "core";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

beforeEach(() => {
  global.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  cleanup();
});

describe("DiffPage — /specs/:name/diff", () => {
  test("renders version dropdowns and empty state", async () => {
    const versions: PublicSpecVersion[] = [
      { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date() },
      { id: "v2", specId: "1", semver: "1.1.0", checksum: "def", isPrerelease: false, createdAt: new Date() },
    ];

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/versions")) {
        return new Response(
          JSON.stringify({ data: versions, pagination: { hasMore: false, limit: 10, offset: 0, total: 2 } }),
          { status: 200 }
        );
      }
      return new Response(JSON.stringify({ data: { from: "1.0.0", to: "1.1.0", steps: [] } }), { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<DiffPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Compare Versions/i)).toBeTruthy();
    });
  });

  test("shows incremental timeline after selecting two versions", async () => {
    const versions: PublicSpecVersion[] = [
      { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date() },
      { id: "v2", specId: "1", semver: "1.1.0", checksum: "def", isPrerelease: false, createdAt: new Date() },
      { id: "v3", specId: "1", semver: "1.2.0", checksum: "ghi", isPrerelease: false, createdAt: new Date() },
    ];

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/versions")) {
        return new Response(
          JSON.stringify({ data: versions, pagination: { hasMore: false, limit: 10, offset: 0, total: 3 } }),
          { status: 200 }
        );
      }
      if (url.includes("/compare")) {
        return new Response(
          JSON.stringify({
            data: {
              from: "1.0.0",
              to: "1.2.0",
              steps: [
                {
                  version: "1.1.0",
                  previousVersion: "1.0.0",
                  classification: "minor",
                  breakingChanges: [],
                  safeChanges: [
                    { id: "chg-1", rule: "endpoint-added", description: "Added endpoint", path: "/test", category: "structural" },
                  ],
                },
                {
                  version: "1.2.0",
                  previousVersion: "1.1.0",
                  classification: "minor",
                  breakingChanges: [],
                  safeChanges: [
                    { id: "chg-2", rule: "endpoint-added", description: "Added another endpoint", path: "/test2", category: "structural" },
                  ],
                },
              ],
            },
          }),
          { status: 200 }
        );
      }
      return new Response("{}", { status: 200 });
    }) as unknown as typeof globalThis.fetch;

    render(<DiffPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Compare Versions/i)).toBeTruthy();
    });

    // Select version A and B
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBe(2);

    fireEvent.change(selects[0], { target: { value: "1.0.0" } });
    fireEvent.change(selects[1], { target: { value: "1.2.0" } });

    await waitFor(() => {
      expect(screen.getByText(/Changes from 1\.0\.0 to 1\.2\.0/i)).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getAllByText(/1\.1\.0/i).length).toBeGreaterThanOrEqual(3);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/1\.2\.0/i).length).toBeGreaterThanOrEqual(3);
    });
  });
});
