import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";

export type DatabaseBackend = "sqlite" | "postgresql";
export type AuthMode = "none" | "keycloak";
export type RoleSource = "scope" | "realm_access.roles";

export interface KeycloakAuthConfig {
  mode: "keycloak";
  serverUrl: string;
  realm: string;
  clientId: string;
  audience?: string;
  roleSource?: RoleSource;
}

export type RemoteAuthConfig = { mode: "none" } | KeycloakAuthConfig;

export interface LocalAuthConfig {
  mode: AuthMode;
  serverUrl?: string;
  realm?: string;
  clientId?: string;
  audience?: string;
  roleSource?: RoleSource;
}

export interface Config {
  mode: "local" | "remote";
  remote?: {
    url: string;
    auth?: RemoteAuthConfig;
  };
  local?: {
    port: number;
    database?: DatabaseBackend;
    sqlitePath?: string;
    postgresUrl?: string;
    auth?: LocalAuthConfig;
  };
}

export const CONFIG_PATH = () => path.join(os.homedir(), ".grapity", "config.yaml");

const DEFAULT_CONFIG: Config = {
  mode: "local",
  local: {
    port: 3750,
    database: "sqlite",
  },
};

export function configExists(): boolean {
  return fs.existsSync(CONFIG_PATH());
}

export function getConfig(): Config {
  const configPath = CONFIG_PATH();

  if (!fs.existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const content = fs.readFileSync(configPath, "utf-8");
  let parsed: unknown;
  try {
    parsed = yaml.load(content);
  } catch {
    return DEFAULT_CONFIG;
  }

  if (!parsed || typeof parsed !== "object") {
    return DEFAULT_CONFIG;
  }

  const config = parsed as Config;

  // Backward compatibility: configs that predate the `database` field store
  // only sqlitePath. Treat them as SQLite.
  let database: DatabaseBackend = config.local?.database ?? DEFAULT_CONFIG.local!.database!;
  if (!config.local?.database && config.local?.sqlitePath) {
    database = "sqlite";
  }

  return {
    mode: config.mode ?? DEFAULT_CONFIG.mode,
    remote: config.remote,
    local: {
      port: config.local?.port ?? DEFAULT_CONFIG.local!.port,
      database,
      sqlitePath: config.local?.sqlitePath,
      postgresUrl: config.local?.postgresUrl,
      auth: config.local?.auth,
    },
  };
}

export function getRegistryUrl(): string {
  const config = getConfig();
  if (config.mode === "remote") {
    return config.remote?.url ?? "https://api.grapity.dev";
  }
  return `http://localhost:${config.local?.port ?? 3750}`;
}

export function isPostgresqlUrl(value: string): boolean {
  return value.startsWith("postgresql://") || value.startsWith("postgres://");
}