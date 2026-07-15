import "@testing-library/jest-dom";
import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  it,
  expect,
} from "bun:test";
import { render, screen, waitFor, cleanup, fireEvent, renderHook } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "hub/App";
import { Header } from "hub/components/layout/Header";
import { useApiClient } from "hub/api/client";
import { ThemeProvider } from "hub/context/ThemeContext";
import { startServer } from "registry/serve";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import { fetchToken, startKeycloak, REALM } from "../../registry/integration/keycloak";
import { Providers } from "../test-utils";

let postgresContainer: Awaited<ReturnType<InstanceType<typeof PostgreSqlContainer>["start"]>>;
let keycloak: Awaited<ReturnType<typeof startKeycloak>>;
let registry: Awaited<ReturnType<typeof startServer>>;
let registryUrl: string;
let keycloakServerUrl: string;
let happyFetch: typeof globalThis.fetch;

function appWrapper({ children }: { children: React.ReactNode }) {
  return <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>;
}

function hookWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter>
      <Providers>{children}</Providers>
    </MemoryRouter>
  );
}

function headerWrapper({ children }: { children: React.ReactNode }) {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <Providers>
        <ThemeProvider>{children}</ThemeProvider>
      </Providers>
    </MemoryRouter>
  );
}

function useNodeFetch() {
  // @ts-ignore
  const nodeFetch: typeof globalThis.fetch = globalThis.__NODE_FETCH__;
  globalThis.fetch = nodeFetch;
  (window as unknown as { fetch: typeof globalThis.fetch }).fetch = nodeFetch;
}

function restoreHappyFetch() {
  globalThis.fetch = happyFetch;
  (window as unknown as { fetch: typeof globalThis.fetch }).fetch = happyFetch;
}

beforeAll(async () => {
  if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
    return;
  }

  happyFetch = globalThis.fetch;

  postgresContainer = await new PostgreSqlContainer("postgres:16")
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
    .start();

  keycloak = await startKeycloak();
  keycloakServerUrl = keycloak.serverUrl;

  registry = await startServer({
    port: 0,
    hostname: "127.0.0.1",
    database: "postgresql",
    postgresUrl: postgresContainer.getConnectionUri(),
    auth: {
      mode: "keycloak",
      serverUrl: keycloakServerUrl,
      realm: REALM,
      audience: "grapity-cli",
      roleSource: "scope",
    },
  });

  const address = registry.server.address();
  const port = address && typeof address === "object" ? address.port : 3750;
  registryUrl = `http://127.0.0.1:${port}`;
}, 300_000);

afterAll(async () => {
  if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
    return;
  }
  await registry.server.close();
  await (registry.store as { end(): Promise<void> }).end();
  await postgresContainer.stop();
  await keycloak.stop();
});

beforeEach(() => {
  if (process.env.SKIP_KEYCLOAK_INTEGRATION) {
    return;
  }
  window.__GRAPITY_CONFIG__ = {
    registryUrl,
    auth: {
      mode: "keycloak",
      serverUrl: keycloakServerUrl,
      realm: REALM,
      clientId: "grapity-hub",
      audience: "grapity-cli",
    },
  };
  window.location.href = "http://localhost:3000/";
  sessionStorage.clear();
  localStorage.clear();
  useNodeFetch();
});

afterEach(() => {
  cleanup();
  delete window.__GRAPITY_CONFIG__;
  sessionStorage.clear();
  localStorage.clear();
  restoreHappyFetch();
});

describe("Hub Keycloak integration", () => {
  it("shows the Keycloak login landing page when no token is present", async () => {
    render(<App />, { wrapper: appWrapper });

    await waitFor(() => {
      expect(screen.getByText(/Explore and manage your API specs/i)).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: /Sign in with Keycloak/i })).toBeTruthy();
  });

  it("redirects to the running Keycloak authorization endpoint when signing in", async () => {
    const originalLocation = window.location;
    let assignedUrl = "";

    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: "http://localhost:3000",
        pathname: "/",
        search: "",
        get href() {
          return "http://localhost:3000/";
        },
        set href(value: string) {
          assignedUrl = value;
        },
      },
    });

    render(<App />, { wrapper: appWrapper });

    await waitFor(() => {
      expect(screen.getByText(/Explore and manage your API specs/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign in with Keycloak/i }));

    await waitFor(() => {
      expect(assignedUrl).not.toBe("");
    });

    const url = new URL(assignedUrl);
    expect(url.origin).toBe(new URL(keycloakServerUrl).origin);
    expect(url.pathname).toBe(`/realms/${REALM}/protocol/openid-connect/auth`);
    expect(url.searchParams.get("client_id")).toBe("grapity-hub");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid specs:read");
    expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:3000/callback");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("nonce")).toBeTruthy();

    const verifier = localStorage.getItem("grapity_pkce_verifier");
    expect(verifier).toBeTruthy();
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier!));
    const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(url.searchParams.get("code_challenge")).toBe(challenge);

    const postLoginPath = localStorage.getItem("grapity_post_login_path");
    expect(postLoginPath).toBeNull();

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("preserves a protected path as the post-login redirect", async () => {
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        origin: "http://localhost:3000",
        pathname: "/specs/payments-api",
        search: "?tab=versions",
        get href() {
          return "http://localhost:3000/specs/payments-api?tab=versions";
        },
        set href(_value: string) {
          // no-op
        },
      },
    });

    render(<App />, { wrapper: appWrapper });

    await waitFor(() => {
      expect(screen.getByText(/Explore and manage your API specs/i)).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign in with Keycloak/i }));

    await waitFor(() => {
      expect(localStorage.getItem("grapity_post_login_path")).toBe("/specs/payments-api?tab=versions");
    });

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("uses a real Keycloak token to read specs through the API client", async () => {
    const token = await fetchToken(keycloakServerUrl, "grapity-cli", "grapity-cli-secret");

    await fetch(`${registryUrl}/v1/specs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: "payments-api",
        content: JSON.stringify({
          openapi: "3.1.0",
          info: { title: "Payments API", version: "1.0.0" },
          paths: {
            "/payments": {
              get: {
                operationId: "listPayments",
                responses: { "200": { description: "Payments" } },
              },
            },
          },
        }),
      }),
    });

    localStorage.setItem("grapity_access_token", token);

    const { result } = renderHook(() => useApiClient(), { wrapper: hookWrapper });
    const specs = await result.current.listSpecs();
    expect(specs).toHaveLength(1);
    expect(specs[0].name).toBe("payments-api");
  });

  it("shows the authenticated header when a valid token is stored", async () => {
    const token = await fetchToken(keycloakServerUrl, "grapity-cli", "grapity-cli-secret");
    localStorage.setItem("grapity_access_token", token);

    render(<Header />, { wrapper: headerWrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Sign out/i })).toBeTruthy();
    });
  });
});
