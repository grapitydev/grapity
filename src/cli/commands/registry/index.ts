import { Command } from "commander";
import { pushCommand } from "./push";
import { validateCommand } from "./validate";
import { listCommand } from "./list";
import { versionsCommand } from "./versions";
import { getCommand } from "./get";
import { deleteCommand } from "./delete";
import { specCommand } from "./spec";

export const registryCommand = new Command("registry")
  .description("Manage specs in the grapity registry")
  .addCommand(pushCommand)
  .addCommand(validateCommand)
  .addCommand(listCommand)
  .addCommand(versionsCommand)
  .addCommand(getCommand)
  .addCommand(deleteCommand)
  .addCommand(specCommand);