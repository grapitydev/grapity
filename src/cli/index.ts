import { Command } from "commander";
import { registryCommand } from "./commands/registry/index";
import { gatewayCommand } from "./commands/gateway/index";
import { initCommand } from "./commands/init";
import { authCommand } from "./commands/auth";
import { createServeCommand } from "./commands/serve";
import { createRequire } from "node:module";

import { materializeCommand } from "./commands/materialize";

const require = createRequire(import.meta.url);
const { version } = require("../../package.json");

const program = new Command();

program
  .name("grapity")
  .description("grapity - API spec registry and compatibility guardian")
  .version(version)
  .addHelpText(
    "after",
    "\nDocumentation: https://grapity.dev/docs/getting-started/quickstart"
  );

program.addCommand(registryCommand);
program.addCommand(gatewayCommand);
program.addCommand(materializeCommand);
program.addCommand(initCommand);
program.addCommand(authCommand);
program.addCommand(createServeCommand(version));

program.parse();