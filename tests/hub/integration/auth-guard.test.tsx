import "@testing-library/jest-dom";
import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "hub/App";
import type { HubAuthConfig } from "hub/context/ConfigContext";

function wrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
}

function mockFetchJson(body: unknown) {
  global.fetch = (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as unknown as typeof globalThis.fetch;
}

const authConfig: HubAuthConfig = {
  mode: "keycloak",
  serverUrl: "https://keycloak.grapity.dev",
  realm: "grapity-demo",
  clientId: "grapity-hub",
};

beforeEach(() => {
  window.__GRAPITY_CONFIG__ = {
    registryUrl: "https://registry-demo.grapity.dev",
    auth: authConfig,
  };
  sessionStorage.clear();
  localStorage.clear();
  global.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  cleanup();
  delete window.__GRAPITY_CONFIG__;
  sessionStorage.clear();
  localStorage.clear();
});

describe("AuthGuard — login landing page", () => {
  test("shows Keycloak login page when auth is configured and user is not authenticated", async () => {
    render(<App />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Explore and manage your API specs/i)).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: /Sign in with Keycloak/i })).toBeTruthy();
    expect(screen.queryByText(/Failed to load specs/i)).toBeNull();
    expect(screen.queryByText(/Browse All Specs/i)).toBeNull();
  });

  test("shows spec list when auth is not configured", async () => {
    window.__GRAPITY_CONFIG__ = { registryUrl: "https://registry-demo.grapity.dev" };
    mockFetchJson({ data: [] });

    render(<App />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Browse All Specs/i)).toBeTruthy();
    });

    expect(screen.queryByText(/Sign in to Grapity Hub/i)).toBeNull();
  });

  test("shows a redirecting state after clicking the sign-in button", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: "http://localhost:3000",
        pathname: "/",
        search: "",
        get href() {
          return "http://localhost:3000/";
        },
        set href(_value: string) {
          // no-op: prevent actual navigation
        },
      },
    });

    render(<App />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Explore and manage your API specs/i)).toBeTruthy();
    });

    const button = screen.getByRole("button", { name: /Sign in with Keycloak/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Redirecting/i })).toBeTruthy();
    });

    expect((screen.getByRole("button", { name: /Redirecting/i }) as HTMLButtonElement).disabled).toBe(true);

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});
