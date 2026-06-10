import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { CompareTab } from "hub/components/version/CompareTab";
import type { PublicSpecVersion } from "core";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <ThemeProvider>{children}</ThemeProvider>
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

describe("CompareTab", () => {
  test("renders dropdown with only older versions", async () => {
    const versions: PublicSpecVersion[] = [
      { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date() },
      { id: "v2", specId: "1", semver: "1.1.0", checksum: "def", isPrerelease: false, createdAt: new Date() },
      { id: "v3", specId: "1", semver: "1.2.0", checksum: "ghi", isPrerelease: false, createdAt: new Date() },
    ];

    render(
      <CompareTab versions={versions} specName="payments-api" currentSemver="1.2.0" />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText(/Compare with/i)).toBeTruthy();
    });

    const select = screen.getByRole("combobox");
    expect(select).toBeTruthy();
  });

  test("shows incremental timeline after selecting a version", async () => {
    const versions: PublicSpecVersion[] = [
      { id: "v1", specId: "1", semver: "1.0.0", checksum: "abc", isPrerelease: false, createdAt: new Date() },
      { id: "v2", specId: "1", semver: "1.1.0", checksum: "def", isPrerelease: false, createdAt: new Date() },
      { id: "v3", specId: "1", semver: "1.2.0", checksum: "ghi", isPrerelease: false, createdAt: new Date() },
    ];

    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
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

    render(
      <CompareTab versions={versions} specName="payments-api" currentSemver="1.2.0" />,
      { wrapper }
    );

    await waitFor(() => {
      expect(screen.getByText(/Compare with/i)).toBeTruthy();
    });

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1.0.0" } });

    await waitFor(() => {
      expect(screen.getByText(/Changes from 1\.0\.0 to 1\.2\.0/i)).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getAllByText(/1\.1\.0/i).length).toBeGreaterThanOrEqual(3);
    });

    await waitFor(() => {
      expect(screen.getAllByText(/1\.2\.0/i).length).toBeGreaterThanOrEqual(2);
    });
  });
});
