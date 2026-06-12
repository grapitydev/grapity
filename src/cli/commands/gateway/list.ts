// CLI REFERENCE: grapity.dev/docs/cli-reference/gateway.md#grapity-gateway-list
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import { client } from "../../client";
import { formatError, formatEmptyState, formatGatewayConfig } from "../../output";

export const listCommand = new Command("list")
  .description("List all gateway configs in the registry")
  .action(async () => {
    try {
      const configs = await client.listGatewayConfigs();

      if (configs.length === 0) {
        console.log(formatEmptyState("No gateway configs in the registry.", [
          "Push one with:  grapity gateway push ./gateway.config.yaml",
        ]));
        return;
      }

      for (const config of configs) {
        console.log(formatGatewayConfig(config));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
