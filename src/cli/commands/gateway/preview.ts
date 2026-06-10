import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import { client } from "../../client";
import { parseGatewayConfig } from "../../gateway-engine/parser";
import { generateDeckYaml } from "../../gateway-engine/generator";
import { formatError } from "../../output";

export const previewCommand = new Command("preview")
  .description("Render decK YAML from a gateway config")
  .argument("[file]", "Path to local gateway config YAML (omit for registry mode)")
  .requiredOption("--env <name>", "Target environment name")
  .option("--name <name>", "Gateway config name (registry mode)")
  .option("--version <uuid>", "Specific version UUID (registry mode, defaults to latest)")
  .option("--output <file>", "Write decK YAML to a file instead of stdout")
  .action(async (file, options) => {
    try {
      let parsedConfig;

      if (file) {
        // Local file mode
        const filePath = path.resolve(file);
        if (!fs.existsSync(filePath)) {
          throw new Error(
            `File not found: ${file}\n` +
            `Use --name for registry mode: grapity gateway preview --name ${file} --env ${options.env}`
          );
        }
        const content = fs.readFileSync(filePath, "utf-8");
        parsedConfig = parseGatewayConfig(content);

        // Validate environment exists
        if (!parsedConfig.environments[options.env]) {
          throw new Error(`Environment "${options.env}" not found in gateway config "${parsedConfig.name}"`);
        }
      } else if (options.name) {
        // Registry mode
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
        parsedConfig = parseGatewayConfig(version.content);

        // Validate environment exists
        if (!parsedConfig.environments[options.env]) {
          throw new Error(`Environment "${options.env}" not found in gateway config "${parsedConfig.name}"`);
        }
      } else {
        throw new Error("Provide a file path or --name for registry mode");
      }

      const deckYaml = generateDeckYaml(parsedConfig, options.env);

      if (options.output) {
        fs.writeFileSync(path.resolve(options.output), deckYaml, "utf-8");
        console.log(`  decK YAML written to ${options.output}`);
      } else {
        console.log(deckYaml);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("preview failed", message));
      process.exit(1);
    }
  });
