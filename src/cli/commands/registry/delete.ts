import { Command } from "commander";
import { client } from "../../client";
import { formatDeleteSuccess, formatError } from "../../output";
import * as readline from "node:readline";

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export const deleteCommand = new Command("delete")
  .description("Delete a spec and all its versions from the registry")
  .argument("<name>", "Name of the spec")
  .option("-f, --force", "Skip confirmation prompt")
  .action(async (name, options) => {
    if (!options.force) {
      console.error(
        `  This will permanently delete "${name}" and all its versions. This cannot be undone.`
      );
      const answer = await prompt("Delete? (Y/n) > ");
      if (answer !== "" && answer !== "y" && answer !== "yes") {
        console.log("Cancelled.");
        process.exit(0);
      }
    }

    try {
      await client.deleteSpec(name);
      console.log(formatDeleteSuccess(name));
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("request failed", message));
      process.exit(1);
    }
  });
