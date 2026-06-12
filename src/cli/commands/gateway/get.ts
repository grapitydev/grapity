// CLI REFERENCE: grapity.dev/docs/cli-reference/gateway.md#grapity-gateway-get
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import { client } from "../../client";
import { formatError, formatGatewayConfigDetail } from "../../output";

export const getCommand = new Command("get")
  .description("Get details for a gateway config")
  .argument("<name>", "Name of the gateway config")
  .option("--version <uuid>", "Specific version UUID (defaults to latest)")
  .action(async (name, options) => {
    try {
      if (options.version) {
        const [config, version] = await Promise.all([
          client.getGatewayConfig(name),
          client.getGatewayConfigVersion(name, options.version),
        ]);
        console.log(formatGatewayConfigDetail(config, version));
      } else {
        const config = await client.getGatewayConfig(name);
        console.log(formatGatewayConfigDetail(config, null));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
