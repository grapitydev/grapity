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
  localStorage.clear();
  global.fetch = (async () => new Response("{}", { status: 200 })) as unknown as typeof globalThis.fetch;
});

afterEach(() => {
  cleanup();
  delete window.__GRAPITY_CONFIG__;
  localStorage.clear();
});

describe("AuthGuard — anonymous browsing", () => {
  test("renders the spec list anonymously when auth is configured and no session exists", async () => {
    mockFetchJson({ data: [] });

    render(<App />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Browse All Specs/i)).toBeTruthy();
    });

    expect(screen.getByRole("button", { name: /^Sign in$/i })).toBeTruthy();
    expect(screen.queryByText(/Sign in with Keycloak/i)).toBeNull();
  });

  test("shows spec list when auth is not configured", async () => {
    window.__GRAPITY_CONFIG__ = { registryUrl: "https://registry-demo.grapity.dev" };
    mockFetchJson({ data: [] });

    render(<App />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Browse All Specs/i)).toBeTruthy();
    });

    expect(screen.queryByRole("button", { name: /Sign in/i })).toBeNull();
  });

  test("initiates the Keycloak login flow when clicking Sign in", async () => {
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

    mockFetchJson({ data: [] });
    render(<App />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Browse All Specs/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /^Sign in$/i }));

    expect(localStorage.getItem("grapity_pkce_verifier")).toBeTruthy();
    expect(localStorage.getItem("grapity_oidc_state")).toBeTruthy();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });
});
