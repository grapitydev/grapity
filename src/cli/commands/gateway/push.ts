import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import ora from "ora";
import chalk from "chalk";
import { client } from "../../client";
import { parseGatewayConfig } from "../../gateway-engine/parser";
import { formatError } from "../../output";

export const pushCommand = new Command("push")
  .description("Push a gateway config to the registry")
  .argument("<file>", "Path to the gateway config YAML file")
  .option("--pushed-by <by>", "Identity of the pusher")
  .action(async (file, options) => {
    const filePath = path.resolve(file);
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== ".yaml" && ext !== ".yml") {
      console.error(formatError("invalid file", "Gateway config files must be YAML (.yaml or .yml)"));
      process.exit(1);
    }

    const content = fs.readFileSync(filePath, "utf-8");

    const spinner = ora({
      text: `Parsing gateway config…`,
      color: "cyan",
    }).start();

    try {
      const parsed = parseGatewayConfig(content);

      spinner.text = `Pushing ${chalk.hex("#6366f1").bold(parsed.name)}…`;

      const environments: Record<string, { name: string; kongAddr: string; upstream: string; plugins: { name: string; config: Record<string, unknown>; order?: number }[] }> = {};
      for (const [envName, env] of Object.entries(parsed.environments)) {
        environments[envName] = {
          name: envName,
          kongAddr: env.kongAddr,
          upstream: env.upstream,
          plugins: env.plugins,
        };
      }

      const result = await client.pushGatewayConfig({
        name: parsed.name,
        provider: parsed.provider as "kong",
        specName: parsed.specName,
        specSemver: parsed.specSemver,
        routes: parsed.routes,
        environments,
        callerIdentification: parsed.callerIdentification,
        content,
        pushedBy: options.pushedBy,
      });

      spinner.stop();
      console.log(`  ${chalk.hex("#a5f3c4")("✓")} ${chalk.hex("#6366f1").bold(result.config.name)} pushed`);
      console.log(`  ${chalk.hex("#8888a0").dim("◆")} Version ${chalk.hex("#6366f1").bold(result.version.id)}`);
    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("push failed", message));
      process.exit(1);
    }
  });
