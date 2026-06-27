import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import type { DemoEnv } from "./types";

export function writeDemoConfig(env: DemoEnv): void {
  const configPath = path.join(os.homedir(), ".grapity", "config.yaml");
  const configDir = path.dirname(configPath);

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const config = {
    mode: "local",
    local: {
      port: env.GRAPITY_REGISTRY_PORT,
      database: "sqlite",
      sqlitePath: env.GRAPITY_DATABASE_PATH,
      auth: {
        mode: "keycloak",
        serverUrl: env.GRAPITY_KEYCLOAK_SERVER_URL.replace(/\/$/, ""),
        realm: env.GRAPITY_KEYCLOAK_REALM,
        clientId: env.GRAPITY_KEYCLOAK_CLIENT_ID,
        audience: env.GRAPITY_KEYCLOAK_AUDIENCE,
        roleSource: env.GRAPITY_KEYCLOAK_ROLE_SOURCE,
      },
    },
  };

  fs.writeFileSync(configPath, yaml.dump(config), "utf-8");
}
