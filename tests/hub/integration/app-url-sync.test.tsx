import "@testing-library/jest-dom";
import "../setup";
import { afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { AuthProvider } from "hub/context/AuthContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { SpecExplorerProvider } from "hub/context/SpecExplorerContext";
import App from "hub/App";
import type { SpecListItem } from "core";

function mockFetchJson(body: unknown) {
  global.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof globalThis.fetch;
}

const sampleSpecs: SpecListItem[] = [
  {
    id: "1",
    name: "payments-api",
    type: "openapi" as const,
    owner: "platform-team",
    tags: ["payments", "public"],
    createdAt: new Date(),
    updatedAt: new Date(),
    latestVersion: {
      id: "v1",
      specId: "1",
      semver: "1.0.0",
      checksum: "abc",
      isPrerelease: false,
      createdAt: new Date(),
      compatibility: {
        previousVersion: "0.0.0",
        classification: "initial" as const,
        breakingChanges: [],
        safeChanges: [],
      },
    },
  },
  {
    id: "2",
    name: "events-api",
    type: "asyncapi" as const,
    owner: "payments-team",
    tags: ["internal"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/"]} initialIndex={0}>
      <ConfigProvider>
        <AuthProvider>
          <ThemeProvider>
            <SpecExplorerProvider>{children}</SpecExplorerProvider>
          </ThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
});

describe("App URL filter sync", () => {
  test("updates URL when sidebar filters change", async () => {
    mockFetchJson({ data: sampleSpecs });
    render(<App />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /openapi/i }));

    await waitFor(() => {
      expect(screen.getByText("Type: openapi")).toBeTruthy();
    });
  });

  test("reads filters from URL on load and renders active chips", async () => {
    function wrapperWithUrl({ children }: { children: React.ReactNode }) {
      return (
        <MemoryRouter initialEntries={["/?type=asyncapi&tags=payments"]} initialIndex={0}>
          <ConfigProvider>
            <AuthProvider>
              <ThemeProvider>
                <SpecExplorerProvider>{children}</SpecExplorerProvider>
              </ThemeProvider>
            </AuthProvider>
          </ConfigProvider>
        </MemoryRouter>
      );
    }

    mockFetchJson({ data: sampleSpecs });
    render(<App />, { wrapper: wrapperWithUrl });

    await waitFor(() => {
      expect(screen.getByText("Type: asyncapi")).toBeTruthy();
      expect(screen.getByText("Tag: payments")).toBeTruthy();
    });
  });
});
