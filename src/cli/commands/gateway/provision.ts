// CLI REFERENCE: grapity.dev/docs/cli-reference/gateway.md#grapity-gateway-provision
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { client } from "../../client";
import { parseGatewayConfig } from "../../gateway-engine/parser";
import { generateDeckYaml } from "../../gateway-engine/generator";
import { buildDeckEnvironment } from "../../gateway-engine/environment";
import { formatError } from "../../output";

export const provisionCommand = new Command("provision")
  .description("Provision a gateway config to a Kong environment via decK")
  .requiredOption("--name <name>", "Gateway config name")
  .requiredOption("--env <name>", "Target environment name")
  .option("--version <uuid>", "Specific config version (defaults to latest)")
  .option("--sync", "Apply changes via deck sync (default is deck diff)")
  .action(async (options) => {
    try {
      // 1. Fetch config version
      let versionId: string;

      if (options.version) {
        versionId = options.version;
      } else {
        const versions = await client.listGatewayConfigVersions(options.name);
        if (versions.length === 0) {
          throw new Error(`No versions found for gateway config "${options.name}"`);
        }
        versionId = versions[0].id;
      }

      const version = await client.getGatewayConfigVersion(options.name, versionId);
      const parsedConfig = parseGatewayConfig(version.content);

      // 2. Validate environment exists
      if (!parsedConfig.environments[options.env]) {
        throw new Error(`Environment "${options.env}" not found in gateway config "${parsedConfig.name}"`);
      }

      // 3. Generate decK YAML
      const deckYaml = generateDeckYaml(parsedConfig, options.env);

      // 4. Write to temp file
      const tmpFile = path.join(os.tmpdir(), `grapity-deck-${Date.now()}.yaml`);
      fs.writeFileSync(tmpFile, deckYaml, "utf-8");

      try {
        // 5. Build deck environment
        const deckEnv = buildDeckEnvironment(parsedConfig, options.env);

        // 6. Run deck
        const deckCommand = options.sync ? "sync" : "diff";
        const args = ["gateway", deckCommand, tmpFile];

        console.log(`  Running deck gateway ${deckCommand} against ${deckEnv.kongAddr}…`);

        const exitCode = await runDeck(args, deckEnv.envVars);

        if (exitCode !== 0) {
          process.exit(exitCode);
        }

        console.log(`  ${options.sync ? "Applied" : "Diff computed"} for ${options.name} → ${options.env}`);
      } finally {
        // Cleanup temp file
        try {
          fs.unlinkSync(tmpFile);
        } catch {
          // ignore cleanup errors
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("provision failed", message));
      process.exit(1);
    }
  });

function runDeck(args: string[], envVars: Record<string, string>): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("deck", args, {
      stdio: "inherit",
      env: { ...process.env, ...envVars },
    });

    child.on("error", (err) => {
      if (err.message.includes("ENOENT")) {
        reject(new Error("deck binary not found. Install decK: https://docs.konghq.com/deck/"));
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}
