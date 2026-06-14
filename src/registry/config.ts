import type { AuthConfig } from "./auth/config";

export type DatabaseBackend = "sqlite" | "postgresql";

export interface ServerConfig {
  port: number;
  database: DatabaseBackend;
  sqlitePath?: string;
  postgresUrl?: string;
  auth: AuthConfig;
}

export const defaultConfig: ServerConfig = {
  port: 3750,
  database: "sqlite",
  auth: { mode: "none" },
};
