// CLI REFERENCE: grapity.dev/docs/cli-reference/serve.md
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import os from "node:os";
import path from "node:path";
import {
  formatError,
  formatServeConfig,
  formatHubConfig,
  formatHeader,
  formatReady,
  formatHubReady,
  formatShutdown,
} from "../output";
import { startServer } from "registry/serve";
import { startHubServer } from "hub/serve";
import {
  getConfig,
  configExists,
  isPostgresqlUrl,
  type Config,
  type LocalAuthConfig,
} from "../config";
import type { ServerConfig } from "registry/config";
import { DatabaseConnectionError } from "registry/storage/postgresql";

function resolveServerConfig(
  cliOptions: { port: number; noAuth: boolean },
  cliConfig: Config
): Partial<ServerConfig> {
  if (cliConfig.mode === "remote") {
    throw new Error(
      "grapity serve is for local mode only. " +
        `Your config is set to remote (${cliConfig.remote?.url ?? "no URL"}). ` +
        "Use grapity serve on the machine running the local registry."
    );
  }

  const envUrl = process.env.GRAPITY_DATABASE_URL;
  const local = cliConfig.local;

  const dbValue = envUrl ?? local?.postgresUrl;
  const base: Partial<ServerConfig> = { port: cliOptions.port };

  if (dbValue && isPostgresqlUrl(dbValue)) {
    base.database = "postgresql";
    base.postgresUrl = dbValue;
  } else {
    base.database = "sqlite";
    base.sqlitePath =
      dbValue ??
      local?.sqlitePath ??
      path.join(os.homedir(), ".grapity", "registry.db");
  }

  if (cliOptions.noAuth) {
    base.auth = { mode: "none" };
  } else {
    base.auth = resolveAuthConfig(local?.auth);
  }

  return base;
}

function resolveAuthConfig(
  authConfig: LocalAuthConfig | undefined
): ServerConfig["auth"] {
  if (!authConfig || authConfig.mode === "none") {
    throw new Error(
      "Authentication is required by default. " +
        "Configure it with: grapity init --local --auth keycloak ...\n" +
        "Or run with: grapity serve --no-auth"
    );
  }

  if (!authConfig.serverUrl) {
    throw new Error(
      "Keycloak auth is configured but serverUrl is missing. " +
        "Run grapity init --local --auth keycloak --keycloak-server <url> ..."
    );
  }

  if (!authConfig.realm) {
    throw new Error(
      "Keycloak auth is configured but realm is missing. " +
        "Run grapity init --local --auth keycloak --keycloak-realm <realm> ..."
    );
  }

  return {
    mode: "keycloak",
    serverUrl: authConfig.serverUrl.replace(/\/$/, ""),
    realm: authConfig.realm,
    audience: authConfig.audience,
    roleSource: authConfig.roleSource,
  };
}

async function verifyKeycloakReachable(serverUrl: string, realm: string): Promise<void> {
  const url = `${serverUrl}/realms/${realm}/.well-known/openid-configuration`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`Keycloak returned ${res.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Keycloak is not reachable at ${url}: ${message}\n` +
        "See https://grapity.dev/docs/cli-reference/init#local-mode-with-keycloak to set up a local Keycloak server.\n" +
        "Or run with: grapity serve --no-auth"
    );
  }
}

function maskPostgresUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return url;
  }
}

function formatDatabaseConnectionError(err: DatabaseConnectionError): string {
  return formatError(
    "PostgreSQL is not reachable",
    err.message,
    [
      "Make sure PostgreSQL is running and accessible.",
      "Check the database URL in ~/.grapity/config.yaml or GRAPITY_DATABASE_URL.",
    ]
  );
}

export function createServeCommand(version: string) {
  return new Command("serve")
    .description("Start the local grapity registry server")
    .option("-p, --port <port>", "Port to listen on", "3750")
    .option("--hub-port <port>", "Port for the developer portal (Hub)", "3000")
    .option("--no-hub", "Skip starting the developer portal")
    .option("--no-auth", "Start without authentication")
    .action(async (options) => {
      const port = parseInt(options.port, 10);
      const hubPort = parseInt(options.hubPort, 10);
      const startHub = options.hub !== false;
      const noAuth = options.auth === false;

      if (!configExists()) {
        console.error(
          formatError(
            "not initialized",
            "Run grapity init first to configure the local registry.",
            ["Example: grapity init --local"]
          )
        );
        process.exit(1);
      }

      const cliConfig = getConfig();

      let serverConfig: Partial<ServerConfig>;
      try {
        serverConfig = resolveServerConfig({ port, noAuth }, cliConfig);
      } catch (err) {
        console.error(formatError("invalid config", (err as Error).message));
        process.exit(1);
      }

      if (serverConfig.auth?.mode === "keycloak" && !noAuth) {
        try {
          await verifyKeycloakReachable(
            serverConfig.auth.serverUrl,
            serverConfig.auth.realm
          );
        } catch (err) {
          console.error(formatError("keycloak unreachable", (err as Error).message));
          process.exit(1);
        }
      }

      console.log(formatHeader("grapity", `v${version}`));
      console.log("");

      // ── Registry ──
      console.log(formatHeader("grapity Registry"));
      console.log("");
      console.log(
        formatServeConfig({
          port,
          database: serverConfig.database!,
          dbPath: serverConfig.sqlitePath,
          postgresUrl: serverConfig.postgresUrl,
          authMode: serverConfig.auth?.mode,
          keycloakServer:
            serverConfig.auth?.mode === "keycloak"
              ? serverConfig.auth.serverUrl
              : undefined,
          keycloakRealm:
            serverConfig.auth?.mode === "keycloak"
              ? serverConfig.auth.realm
              : undefined,
          keycloakAudience:
            serverConfig.auth?.mode === "keycloak"
              ? serverConfig.auth.audience
              : undefined,
        })
      );
      console.log("");

      let store;
      try {
        const started = await startServer(serverConfig);
        store = started.store;
      } catch (err) {
        if (err instanceof DatabaseConnectionError) {
          console.error(formatDatabaseConnectionError(err));
        } else {
          console.error(formatError("failed to start server", (err as Error).message));
        }
        process.exit(1);
      }

      console.log(formatReady(port));

      // ── Hub ──
      if (startHub) {
        console.log("");
        console.log(formatHeader("grapity Hub"));
        console.log("");
        console.log(
          formatHubConfig({
            port: hubPort,
            registryUrl: `http://localhost:${port}`,
          })
        );
        console.log("");

        await startHubServer({
          port: hubPort,
          registryUrl: `http://localhost:${port}`,
          auth:
            serverConfig.auth?.mode === "keycloak"
              ? {
                  mode: "keycloak",
                  serverUrl: serverConfig.auth.serverUrl,
                  realm: serverConfig.auth.realm,
                  clientId: "grapity-hub",
                  audience: serverConfig.auth.audience,
                }
              : undefined,
        });

        console.log(formatHubReady(hubPort));
      }

      process.on("SIGINT", async () => {
        console.log("");
        console.log(formatShutdown());
        if ("end" in store && typeof store.end === "function") {
          await store.end();
        }
        process.exit(0);
      });
    });
}
