import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { client } from "../../client";
import { formatError } from "../../output";

export const configCommand = new Command("config")
  .description("Fetch the raw gateway config YAML from the registry")
  .argument("<name>", "Name of the gateway config")
  .option("--version <uuid>", "Specific version UUID (defaults to latest)")
  .option("--output <file>", "Write output to a file instead of stdout")
  .action(async (name, options) => {
    try {
      let content: string;

      if (options.version) {
        const version = await client.getGatewayConfigVersion(name, options.version);
        content = version.content;
      } else {
        const versions = await client.listGatewayConfigVersions(name);
        if (versions.length === 0) {
          console.error(formatError("not found", `No versions found for gateway config "${name}"`));
          process.exit(1);
        }
        const version = await client.getGatewayConfigVersion(name, versions[0].id);
        content = version.content;
      }

      if (options.output) {
        fs.writeFileSync(path.resolve(options.output), content, "utf-8");
        console.log(`  Config written to ${options.output}`);
      } else {
        console.log(content);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
