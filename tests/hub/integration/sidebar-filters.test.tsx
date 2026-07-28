import "@testing-library/jest-dom";
import "../setup";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AuthProvider } from "hub/context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider } from "hub/context/ConfigContext";
import { ThemeProvider } from "hub/context/ThemeContext";
import { SpecExplorerProvider } from "hub/context/SpecExplorerContext";
import { Sidebar } from "hub/components/layout/Sidebar";
import type { SpecListItem } from "core";

interface Filters {
  type?: string;
  owner?: string;
  tags?: string[];
  classification?: string;
  track?: string;
}

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <ThemeProvider>
            <SpecExplorerProvider>{children}</SpecExplorerProvider>
          </ThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
}

const sampleSpecs: SpecListItem[] = [
  {
    id: "1",
    name: "payments-api",
    type: "openapi" as const,
    owner: "platform-team",
    tags: ["payments", "public"],
    visibility: "private",
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
    owner: "payments-team",
    tags: ["internal"],
    visibility: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

afterEach(() => {
  cleanup();
});

describe("Sidebar filters", () => {
  test("renders filter groups", () => {
    render(<Sidebar filters={{ onFilterChange: () => {} }} specs={sampleSpecs} />,
      { wrapper }
    );

    expect(screen.getByText("Filters")).toBeTruthy();
    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Owner")).toBeTruthy();
    expect(screen.getByText("Tags")).toBeTruthy();
    expect(screen.getByText("Classification")).toBeTruthy();
    expect(screen.getByText("Select multiple")).toBeTruthy();
    expect(screen.queryByText("Track")).toBeNull();
  });

  test("does not offer asyncapi as a type option", () => {
    render(<Sidebar filters={{ onFilterChange: () => {} }} specs={sampleSpecs} />,
      { wrapper }
    );

    expect(screen.getByRole("button", { name: /openapi/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /asyncapi/i })).toBeNull();
  });

  test("shows active filter count and clear all", () => {
    let latestFilters: Filters = {};
    render(
      <Sidebar
        filters={{
          type: "openapi",
          tags: ["payments"],
          onFilterChange: (f) => {
            latestFilters = f;
          },
        }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    expect(screen.getByText("2 active")).toBeTruthy();
    const clearAll = screen.getByRole("button", { name: /Clear all/i });
    expect(clearAll).toBeTruthy();

    fireEvent.click(clearAll);
    expect(latestFilters).toEqual({});
  });

  test("selects type filter", () => {
    let latestFilters: Filters = {};
    render(
      <Sidebar
        filters={{
          onFilterChange: (f) => {
            latestFilters = f;
          },
        }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /openapi/i }));
    expect(latestFilters.type).toBe("openapi");
  });

  test("selects owner filter from dynamic options", () => {
    let latestFilters: Filters = {};
    render(
      <Sidebar
        filters={{
          onFilterChange: (f) => {
            latestFilters = f;
          },
        }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    expect(screen.getByRole("button", { name: /platform-team/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /payments-team/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /api-team/i })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /platform-team/i }));
    expect(latestFilters.owner).toBe("platform-team");
  });

  test("accumulates tag selections from dynamic options", () => {
    let latestFilters: Filters = { tags: ["payments"] };
    render(
      <Sidebar
        filters={{
          tags: ["payments"],
          onFilterChange: (f) => {
            latestFilters = f;
          },
        }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    expect(screen.getByText("payments")).toBeTruthy();
    expect(screen.getByText("public")).toBeTruthy();
    expect(screen.getByText("internal")).toBeTruthy();

    fireEvent.click(screen.getByText("public"));
    expect(latestFilters.tags).toContain("payments");
    expect(latestFilters.tags).toContain("public");
  });

  test("selects classification filter", () => {
    let latestFilters: Filters = {};
    render(
      <Sidebar
        filters={{
          onFilterChange: (f) => {
            latestFilters = f;
          },
        }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Patch/i }));
    expect(latestFilters.classification).toBe("patch");
  });

  test("pre-release checkbox sets track and greys out classification radios", () => {
    let latestFilters: Filters = { classification: "major" };
    render(
      <Sidebar
        filters={{
          classification: "major",
          onFilterChange: (f) => {
            latestFilters = f;
          },
        }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Pre-release/i }));
    expect(latestFilters.track).toBe("prerelease");
    expect(latestFilters.classification).toBe("major");
  });

  test("classification radios are disabled while pre-release is checked", () => {
    render(
      <Sidebar
        filters={{ classification: "major", track: "prerelease", onFilterChange: () => {} }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    expect(screen.getByRole("button", { name: /Major/i }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("button", { name: /Minor/i }).getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("button", { name: /Patch/i }).getAttribute("aria-disabled")).toBe("true");
  });

  test("unchecking pre-release clears track and restores classification radios", () => {
    let latestFilters: Filters = { classification: "major", track: "prerelease" };
    render(
      <Sidebar
        filters={{
          classification: "major",
          track: "prerelease",
          onFilterChange: (f) => {
            latestFilters = f;
          },
        }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    fireEvent.click(screen.getByRole("button", { name: /Pre-release/i }));
    expect(latestFilters.track).toBeUndefined();
    expect(latestFilters.classification).toBe("major");
  });

  test("classification radios are interactive when pre-release is unchecked", () => {
    render(
      <Sidebar
        filters={{ classification: "major", onFilterChange: () => {} }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    expect(screen.getByRole("button", { name: /Major/i }).getAttribute("aria-disabled")).not.toBe("true");
  });

  test("counts only applied filters: pre-release counts, greyed classification does not", () => {
    render(
      <Sidebar
        filters={{ classification: "major", track: "prerelease", onFilterChange: () => {} }}
        specs={sampleSpecs}
      />,
      { wrapper }
    );

    expect(screen.getByText("1 active")).toBeTruthy();
  });

  test("hides Owner and Tags sections when no values exist", () => {
    render(
      <Sidebar filters={{ onFilterChange: () => {} }} specs={[]} />,
      { wrapper }
    );

    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Classification")).toBeTruthy();
    expect(screen.queryByText("Owner")).toBeNull();
    expect(screen.queryByText("Tags")).toBeNull();
  });
});
