import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve, type ServerType } from "@hono/node-server";
import path from "node:path";
import fs from "node:fs";
import { HUB_DIST_PATH } from "./paths";

export interface HubAuthConfig {
  mode: "keycloak";
  serverUrl: string;
  realm: string;
  clientId: string;
  audience?: string;
}

export interface HubConfig {
  port?: number;
  registryUrl?: string;
  publicRegistryUrl?: string;
  auth?: HubAuthConfig;
}

const DEFAULT_PORT = 3000;
const DEFAULT_REGISTRY_URL = "http://localhost:3750";

export interface RunningHubServer {
  app: Hono;
  server: ServerType;
}

export async function startHubServer(userConfig?: Partial<HubConfig>): Promise<RunningHubServer> {
  const config = {
    port: userConfig?.port ?? DEFAULT_PORT,
    registryUrl: userConfig?.publicRegistryUrl ?? userConfig?.registryUrl ?? DEFAULT_REGISTRY_URL,
    proxyUrl: userConfig?.publicRegistryUrl
      ? undefined
      : (userConfig?.registryUrl ?? DEFAULT_REGISTRY_URL),
    auth: userConfig?.auth,
  };

  const app = new Hono();

  // Expose runtime config to the SPA.
  app.get("/config.js", (c) => {
    const clientConfig = {
      registryUrl: config.registryUrl,
      auth: config.auth
        ? {
            mode: config.auth.mode,
            serverUrl: config.auth.serverUrl,
            realm: config.auth.realm,
            clientId: config.auth.clientId,
            audience: config.auth.audience,
          }
        : undefined,
    };
    c.header("Content-Type", "application/javascript");
    return c.body(
      `window.__GRAPITY_CONFIG__ = ${JSON.stringify(clientConfig)};`
    );
  });

  // Proxy /v1/* requests to the Registry only when using a local registry.
  if (config.proxyUrl) {
    app.use("/v1/*", async (c) => {
      const url = new URL(c.req.url);
      const targetUrl = config.proxyUrl + url.pathname + url.search;

      const headers = new Headers(c.req.raw.headers);
      headers.delete("host");

      const response = await fetch(targetUrl, {
        method: c.req.method,
        headers,
        body: c.req.raw.body,
      });

      return response;
    });
  }

  // SPA fallback: any unmatched route returns index.html with the config script injected.
  // This must come before serveStatic so that the root `/` gets the injected config.
  app.get("/*", async (c) => {
    const indexPath = path.join(HUB_DIST_PATH, "index.html");
    if (!fs.existsSync(indexPath)) {
      return c.text(
        "index.html not found. Build the project with 'bun run build' first.",
        404
      );
    }

    const html = fs.readFileSync(indexPath, "utf-8");
    const configScript = `\n    <script src="/config.js"></script>\n  `;
    const injected = html.replace(
      "</head>",
      `${configScript}</head>`
    );
    return c.html(injected);
  });

  // Serve static assets from dist/
  app.use("/*", serveStatic({ root: HUB_DIST_PATH }));

  const server = serve({
    fetch: app.fetch,
    port: config.port,
  });

  return { app, server };
}

