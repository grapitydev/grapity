import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { SpecListPage } from "hub/pages/SpecListPage";
import type { SpecListItem } from "core";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

function mockFetchJson(body: unknown) {
  global.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof globalThis.fetch;
}

function mockFetchError(status: number, errorBody: unknown) {
  global.fetch = (async () =>
    new Response(JSON.stringify(errorBody), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof globalThis.fetch;
}

beforeEach(() => {
  global.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  cleanup();
});

describe("SpecListPage — / (Browse All Specs)", () => {
  test("mounts and shows skeleton while loading", async () => {
    mockFetchJson({ data: [] });
    render(<SpecListPage />, { wrapper });

    expect(screen.getByText(/Browse All Specs/i)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/Push your first spec with/i)).toBeTruthy();
    });
  });

  test("renders empty state when no specs exist", async () => {
    mockFetchJson({ data: [] });
    render(<SpecListPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Push your first spec with/i)).toBeTruthy();
    });
  });

  test("renders spec cards after successful fetch", async () => {
    const specs: SpecListItem[] = [
      {
        id: "1",
        name: "payments-api",
        type: "openapi" as const,
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
      { id: "2", name: "users-api", type: "openapi" as const, tags: ["internal"], createdAt: new Date(), updatedAt: new Date() },
    ];
    mockFetchJson({ data: specs });
    render(<SpecListPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("payments-api")).toBeTruthy();
      expect(screen.getByText("users-api")).toBeTruthy();
      expect(screen.getByText("1.0.0")).toBeTruthy();
    });
  });

  test("filters specs by classification client-side", async () => {
    const specs: SpecListItem[] = [
      {
        id: "1",
        name: "payments-api",
        type: "openapi" as const,
        tags: [],
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
        name: "users-api",
        type: "openapi" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        latestVersion: {
          id: "v2",
          specId: "2",
          semver: "1.1.0",
          checksum: "def",
          isPrerelease: false,
          createdAt: new Date(),
          compatibility: {
            previousVersion: "1.0.0",
            classification: "minor" as const,
            breakingChanges: [],
            safeChanges: [{ id: "1", rule: "endpoint-added", description: "Added GET /users", path: "/users", category: "structural" as const }],
          },
        },
      },
    ];
    mockFetchJson({ data: specs });
    render(<SpecListPage filters={{ classification: "major" }} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("payments-api")).toBeTruthy();
      expect(screen.queryByText("users-api")).toBeNull();
    });
  });

  test("filters specs by minor classification client-side", async () => {
    const specs: SpecListItem[] = [
      {
        id: "1",
        name: "payments-api",
        type: "openapi" as const,
        tags: [],
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
        name: "users-api",
        type: "openapi" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        latestVersion: {
          id: "v2",
          specId: "2",
          semver: "1.1.0",
          checksum: "def",
          isPrerelease: false,
          createdAt: new Date(),
          compatibility: {
            previousVersion: "1.0.0",
            classification: "minor" as const,
            breakingChanges: [],
            safeChanges: [{ id: "1", rule: "endpoint-added", description: "Added GET /users", path: "/users", category: "structural" as const }],
          },
        },
      },
    ];
    mockFetchJson({ data: specs });
    render(<SpecListPage filters={{ classification: "minor" }} />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText("payments-api")).toBeNull();
      expect(screen.getByText("users-api")).toBeTruthy();
    });
  });

  test("shows error state on fetch failure", async () => {
    mockFetchError(500, { error: "internal_error", message: "Server failed" });
    render(<SpecListPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Failed to load specs/i)).toBeTruthy();
    });
  });

  test("filters by type trigger refetch with query param", async () => {
    let capturedUrl = "";
    global.fetch = (async (input: string | URL | Request) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      capturedUrl = url;
      return new Response(JSON.stringify({ data: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof globalThis.fetch;

    render(<SpecListPage filters={{ type: "openapi" }} />, { wrapper });

    await waitFor(() => expect(capturedUrl).toContain("type=openapi"));
  });

  test("filters specs client-side while typing in search input", async () => {
    const specs: SpecListItem[] = [
      {
        id: "1",
        name: "payments-api",
        type: "openapi" as const,
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
      { id: "2", name: "users-api", type: "openapi" as const, tags: ["internal"], createdAt: new Date(), updatedAt: new Date() },
    ];
    mockFetchJson({ data: specs });
    render(<SpecListPage />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("payments-api")).toBeTruthy();
      expect(screen.getByText("users-api")).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText("Search specs...") as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "payments" } });

    await waitFor(() => {
      expect(screen.getByText("payments-api")).toBeTruthy();
      expect(screen.queryByText("users-api")).toBeNull();
    });
  });
});
