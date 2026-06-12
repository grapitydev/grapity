export interface ServerConfig {
  port: number;
  sqlitePath?: string;
}

export const defaultConfig: ServerConfig = {
  port: 3750,
};
