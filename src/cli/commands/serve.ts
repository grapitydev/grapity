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
    .option("--hub-port <port>", "Port for the developer portal (Hub)", "3000")
    .option("--no-hub", "Skip starting the developer portal")
    .action(async (options) => {
      const port = parseInt(options.port, 10);
      const hubPort = parseInt(options.hubPort, 10);
      const startHub = options.hub !== false;
      const dbPath = path.join(os.homedir(), ".grapity", "registry.db");

      const version = getPackageVersion();

      // ── Registry ──
      console.log(formatHeader("grapity Registry", `v${version}`));
      console.log("");
      console.log(formatServeConfig({ port, dbPath }));
      console.log("");

      await startServer({
        port,
        sqlitePath: dbPath,
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
