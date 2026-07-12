import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { AuthProvider } from "hub/context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { SpecListPage } from "hub/pages/SpecListPage";
import type { SpecListItem } from "core";

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

afterEach(() => {
  cleanup();
});

describe("SpecListPage — / (Browse All Specs)", () => {
  test("renders empty state when no specs exist", () => {
    render(<SpecListPage />, { wrapper });

    expect(screen.getByText(/0 specs in the registry/i)).toBeTruthy();
    expect(screen.getByText(/Push your first spec with/i)).toBeTruthy();
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
    render(<SpecListPage specs={specs} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("payments-api")).toBeTruthy();
      expect(screen.getByText("users-api")).toBeTruthy();
      expect(screen.getByText("1.0.0")).toBeTruthy();
    });
  });

  test("filters specs by type client-side", async () => {
    const specs: SpecListItem[] = [
      {
        id: "1",
        name: "payments-api",
        type: "openapi" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "events-api",
        type: "asyncapi" as const,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<SpecListPage specs={specs} filters={{ type: "asyncapi" }} />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText("payments-api")).toBeNull();
      expect(screen.getByText("events-api")).toBeTruthy();
    });
  });

  test("filters specs by owner client-side", async () => {
    const specs: SpecListItem[] = [
      {
        id: "1",
        name: "payments-api",
        type: "openapi" as const,
        owner: "platform-team",
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "users-api",
        type: "openapi" as const,
        owner: "payments-team",
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<SpecListPage specs={specs} filters={{ owner: "payments-team" }} />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText("payments-api")).toBeNull();
      expect(screen.getByText("users-api")).toBeTruthy();
    });
  });

  test("filters specs by tags client-side", async () => {
    const specs: SpecListItem[] = [
      {
        id: "1",
        name: "payments-api",
        type: "openapi" as const,
        tags: ["payments", "public"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "users-api",
        type: "openapi" as const,
        tags: ["internal"],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(<SpecListPage specs={specs} filters={{ tags: ["public"] }} />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("payments-api")).toBeTruthy();
      expect(screen.queryByText("users-api")).toBeNull();
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
    render(<SpecListPage specs={specs} filters={{ classification: "major" }} />, { wrapper });

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
    render(<SpecListPage specs={specs} filters={{ classification: "minor" }} />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByText("payments-api")).toBeNull();
      expect(screen.getByText("users-api")).toBeTruthy();
    });
  });

  test("shows error state when error is provided", () => {
    const error = new Error("Server failed");
    render(<SpecListPage error={error} />, { wrapper });

    expect(screen.getByText(/Failed to load specs/i)).toBeTruthy();
    expect(screen.getByText(/Server failed/i)).toBeTruthy();
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
    render(<SpecListPage specs={specs} />, { wrapper });

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
