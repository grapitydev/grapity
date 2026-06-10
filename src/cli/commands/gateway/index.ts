import { Command } from "commander";
import { listCommand } from "./list";
import { pushCommand } from "./push";
import { getCommand } from "./get";
import { versionsCommand } from "./versions";
import { configCommand } from "./config";
import { previewCommand } from "./preview";
import { provisionCommand } from "./provision";
import { logsCommand } from "./logs";

export const gatewayCommand = new Command("gateway")
  .description("Manage gateway configs and provisioning")
  .addCommand(listCommand)
  .addCommand(pushCommand)
  .addCommand(getCommand)
  .addCommand(versionsCommand)
  .addCommand(configCommand)
  .addCommand(previewCommand)
  .addCommand(provisionCommand)
  .addCommand(logsCommand);
