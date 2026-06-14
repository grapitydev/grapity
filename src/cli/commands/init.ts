// CLI REFERENCE: grapity.dev/docs/cli-reference/init.md
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { formatError, formatInitSuccess } from "../output";
import { isPostgresqlUrl } from "../config";

interface InitConfig {
  mode: "local" | "remote";
  local?: {
    port: number;
    database?: "sqlite" | "postgresql";
    sqlitePath?: string;
    postgresUrl?: string;
    auth?: {
      mode: "none" | "keycloak";
      serverUrl?: string;
      realm?: string;
      clientId?: string;
      audience?: string;
      roleSource?: "scope" | "realm_access.roles";
    };
  };
  remote?: {
    url: string;
    auth?: {
      mode: "keycloak";
      serverUrl: string;
      realm: string;
      clientId: string;
      audience?: string;
      roleSource?: "scope" | "realm_access.roles";
    };
  };
}

export const initCommand = new Command("init")
  .description("Configure grapity registry (local or remote mode)")
  .option("--local", "Use local mode (SQLite or PostgreSQL)")
  .option("--remote", "Use remote mode (connect to a grapity server)")
  .option("--url <url>", "Registry URL (for remote mode)")
  .option("--port <port>", "Port for local server (default: 3750)")
  .option("--db <path-or-url>", "SQLite path or postgresql:// URL (for local mode)")
  .option("--auth <mode>", "Auth mode: none | keycloak (default: none)")
  .option("--keycloak-server <url>", "Keycloak server URL")
  .option("--keycloak-realm <realm>", "Keycloak realm")
  .option("--keycloak-client-id <id>", "Keycloak client ID (for CLI client credentials)")
  .option("--keycloak-audience <audience>", "Keycloak token audience to validate")
  .option("--keycloak-role-source <source>", "Where to read roles from: scope | realm_access.roles (default: scope)")
  .action(async (options) => {
    const configDir = path.join(os.homedir(), ".grapity");
    const configPath = path.join(configDir, "config.yaml");

    let mode: "local" | "remote";

    if (options.local && options.remote) {
      console.error(formatError("invalid flags", "Cannot specify both --local and --remote."));
      process.exit(1);
    }

    if (options.local) {
      mode = "local";
    } else if (options.remote) {
      mode = "remote";
    } else {
      console.error(
        formatError(
          "missing flag",
          "Select registry mode: use --local or --remote.",
      [
        "--local   Run a registry server on this machine",
        "--remote  Connect to an existing grapity server",
      ]
        )
      );
      process.exit(1);
    }

    const authMode = options.auth ?? "none";
    if (authMode !== "none" && authMode !== "keycloak") {
      console.error(formatError("invalid auth mode", "--auth must be one of: none, keycloak"));
      process.exit(1);
    }

    const keycloakAuth = authMode === "keycloak" ? parseKeycloakOptions(options, mode) : undefined;

    const config: InitConfig = { mode };

    if (mode === "local") {
      const dbValue = options.db ?? process.env.GRAPITY_DATABASE_URL;
      const database: "sqlite" | "postgresql" =
        dbValue && isPostgresqlUrl(dbValue) ? "postgresql" : "sqlite";

      config.local = {
        port: options.port ? parseInt(options.port, 10) : 3750,
        database,
      };

      if (database === "postgresql") {
        config.local.postgresUrl = dbValue;
      } else {
        config.local.sqlitePath =
          dbValue ?? path.join(os.homedir(), ".grapity", "registry.db");
      }

    if (keycloakAuth) {
      if (!options.keycloakClientId) {
        console.error(
          formatError(
            "missing flag",
            "--keycloak-client-id is required when using Keycloak auth."
          )
        );
        process.exit(1);
      }
      config.local.auth = {
        mode: "keycloak",
        clientId: options.keycloakClientId,
        ...keycloakAuth,
      };
    }
    } else {
      if (!options.url) {
        console.error(
          formatError(
            "missing flag",
            "--url is required for remote mode.",
            ["Example:  grapity init --remote --url https://api.grapity.dev"]
          )
        );
        process.exit(1);
      }

      config.remote = {
        url: options.url.replace(/\/$/, ""),
      };

      if (keycloakAuth) {
        config.remote.auth = {
          mode: "keycloak",
          serverUrl: keycloakAuth.serverUrl!,
          realm: keycloakAuth.realm!,
          clientId: keycloakAuth.clientId!,
          audience: keycloakAuth.audience,
          roleSource: keycloakAuth.roleSource,
        };
      }
    }

    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const yamlContent = yaml.dump(config);
    fs.writeFileSync(configPath, yamlContent, "utf-8");

    console.log(
      formatInitSuccess({
        configPath,
        mode,
        port: config.local?.port,
        database: config.local?.database,
        dbPath: config.local?.sqlitePath,
        postgresUrl: config.local?.postgresUrl,
        url: config.remote?.url,
        authMode,
        keycloakServer: keycloakAuth?.serverUrl,
        keycloakRealm: keycloakAuth?.realm,
        keycloakClientId:
          config.local?.auth?.clientId ?? config.remote?.auth?.clientId,
      })
    );
  });

function parseKeycloakOptions(
  options: Record<string, string | undefined>,
  _mode: "local" | "remote"
): {
  serverUrl: string;
  realm: string;
  clientId?: string;
  audience?: string;
  roleSource?: "scope" | "realm_access.roles";
} {
  if (!options.keycloakServer) {
    console.error(
      formatError(
        "missing flag",
        "--keycloak-server is required when auth mode is keycloak.",
        ["Example:  --keycloak-server https://keycloak.example.com"]
      )
    );
    process.exit(1);
  }

  if (!options.keycloakRealm) {
    console.error(
      formatError(
        "missing flag",
        "--keycloak-realm is required when auth mode is keycloak.",
        ["Example:  --keycloak-realm grapity"]
      )
    );
    process.exit(1);
  }

  const roleSource = options.keycloakRoleSource as "scope" | "realm_access.roles" | undefined;
  if (roleSource && roleSource !== "scope" && roleSource !== "realm_access.roles") {
    console.error(formatError("invalid role source", "--keycloak-role-source must be one of: scope, realm_access.roles"));
    process.exit(1);
  }

  return {
    serverUrl: options.keycloakServer.replace(/\/$/, ""),
    realm: options.keycloakRealm,
    clientId: options.keycloakClientId,
    audience: options.keycloakAudience,
    roleSource,
  };
}
