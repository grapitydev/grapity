// CLI REFERENCE: grapity.dev/docs/cli-reference/serve.md
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import os from "node:os";
import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
import { getConfig, isPostgresqlUrl, type Config } from "../config";
import type { ServerConfig } from "registry/config";

function getPackageVersion(): string {
  try {
    const pkgPath = new URL("../../../../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version;
  } catch {
    return "unknown";
  }
}

function resolveServerConfig(cliOptions: {
  port: number;
  db?: string;
}, cliConfig: Config): Partial<ServerConfig> {
  const envUrl = process.env.GRAPITY_DATABASE_URL;

  const dbValue = envUrl ?? cliOptions.db;

  if (dbValue) {
    if (isPostgresqlUrl(dbValue)) {
      return { port: cliOptions.port, database: "postgresql", postgresUrl: dbValue };
    }
    return { port: cliOptions.port, database: "sqlite", sqlitePath: dbValue };
  }

  if (cliConfig.mode === "local") {
    const local = cliConfig.local;
    if (local?.database === "postgresql") {
      if (!local.postgresUrl) {
        throw new Error(
          "PostgreSQL is configured but no postgresUrl is set. " +
            "Run grapity init --local --db postgresql://... or set GRAPITY_DATABASE_URL."
        );
      }
      return { port: cliOptions.port, database: "postgresql", postgresUrl: local.postgresUrl };
    }

    return {
      port: cliOptions.port,
      database: "sqlite",
      sqlitePath:
        local?.sqlitePath ?? path.join(os.homedir(), ".grapity", "registry.db"),
    };
  }

  // Remote mode: no local database; fall back to default SQLite path.
  return {
    port: cliOptions.port,
    database: "sqlite",
    sqlitePath: path.join(os.homedir(), ".grapity", "registry.db"),
  };
}

export function createServeCommand(_version: string) {
  return new Command("serve")
    .description("Start the local grapity registry server")
    .option("-p, --port <port>", "Port to listen on", "3750")
    .option("--hub-port <port>", "Port for the developer portal (Hub)", "3000")
    .option("--no-hub", "Skip starting the developer portal")
    .option("--db <path-or-url>", "SQLite path or postgresql:// URL")
    .action(async (options) => {
      const port = parseInt(options.port, 10);
      const hubPort = parseInt(options.hubPort, 10);
      const startHub = options.hub !== false;

      const version = getPackageVersion();
      const cliConfig = getConfig();

      let serverConfig: Partial<ServerConfig>;
      try {
        serverConfig = resolveServerConfig({ port, db: options.db }, cliConfig);
      } catch (err) {
        console.error(formatError("invalid config", (err as Error).message));
        process.exit(1);
      }

      // ── Registry ──
      console.log(formatHeader("grapity Registry", `v${version}`));
      console.log("");
      console.log(
        formatServeConfig({
          port,
          database: serverConfig.database!,
          dbPath: serverConfig.sqlitePath,
          postgresUrl: serverConfig.postgresUrl,
        })
      );
      console.log("");

      const { store } = await startServer(serverConfig);

      console.log(formatReady(port));

      // ── Hub ──
      if (startHub) {
        console.log("");
        console.log(formatHeader("grapity Hub", `v${version}`));
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
