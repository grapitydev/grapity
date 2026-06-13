export type DatabaseBackend = "sqlite" | "postgresql";

export interface ServerConfig {
  port: number;
  database: DatabaseBackend;
  sqlitePath?: string;
  postgresUrl?: string;
}

export const defaultConfig: ServerConfig = {
  port: 3750,
  database: "sqlite",
};
