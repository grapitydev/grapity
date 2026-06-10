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

function getPackageVersion(): string {
  try {
    const pkgPath = new URL("../../../../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version;
  } catch {
    return "unknown";
  }
}

export function createServeCommand(_version: string) {
  return new Command("serve")
    .description("Start the local grapity registry server")
    .option("-p, --port <port>", "Port to listen on", "3750")
    .option("--db <url>", "Database URL (sqlite path or postgresql URL)")
    .option("--auth <mode>", "Auth mode: none, api-key, jwt", "none")
    .option("--hub-port <port>", "Port for the developer portal (Hub)", "3000")
    .option("--no-hub", "Skip starting the developer portal")
    .action(async (options) => {
      const port = parseInt(options.port, 10);
      const hubPort = parseInt(options.hubPort, 10);
      const startHub = options.hub !== false;
      const db = options.db;
      const auth = options.auth;
      const isPostgres = db?.startsWith("postgresql://");
      const dbMode: "sqlite" | "postgresql" = isPostgres ? "postgresql" : "sqlite";
      const dbPath = isPostgres
        ? undefined
        : (db ?? path.join(os.homedir(), ".grapity", "registry.db"));

      const version = getPackageVersion();

      // ── Registry ──
      console.log(formatHeader("grapity Registry", `v${version}`));
      console.log("");
      console.log(formatServeConfig({ mode: dbMode, port, dbPath, auth }));
      console.log("");

      await startServer({
        port,
        database: dbMode,
        sqlitePath: dbPath,
        postgresUrl: isPostgres ? db : undefined,
        auth: auth === "none" ? { mode: "none" } : { mode: auth },
      });

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

      process.on("SIGINT", () => {
        console.log("");
        console.log(formatShutdown());
        process.exit(0);
      });
    });
}
