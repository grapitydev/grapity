import { Command } from "commander";
import { client } from "../../client";
import { formatError } from "../../output";

export const versionsCommand = new Command("versions")
  .description("List versions for a gateway config")
  .argument("<name>", "Name of the gateway config")
  .action(async (name) => {
    try {
      const versions = await client.listGatewayConfigVersions(name);

      if (versions.length === 0) {
        console.log(`  No versions found for ${name}.`);
        return;
      }

      for (const version of versions) {
        console.log(`  ${version.id}  ${version.createdAt}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
