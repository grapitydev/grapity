// CLI REFERENCE: grapity.dev/docs/cli-reference/registry.md#grapity-registry-update
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import ora from "ora";
import chalk from "chalk";
import { client } from "../../client";
import { formatError, formatUpdatedSpec } from "../../output";

export const updateCommand = new Command("update")
  .description("Update spec metadata (visibility)")
  .argument("<name>", "Name of the spec")
  .requiredOption("--visibility <visibility>", "Spec visibility: private or public")
  .action(async (name, options) => {
    const spinner = ora({
      text: `Updating ${chalk.hex("#6366f1").bold(name)}…`,
      color: "cyan",
    }).start();

    try {
      const result = await client.updateSpec(name, { visibility: options.visibility });
      spinner.stop();
      console.log(formatUpdatedSpec(result.spec));
    } catch (err) {
      spinner.stop();
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
