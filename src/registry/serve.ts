import path from "node:path";
import fs from "node:fs";
import { serve } from "@hono/node-server";
import type { ServerType } from "@hono/node-server";
import { createApp } from "./server";
import type { ServerConfig } from "./config";
import { defaultConfig } from "./config";
import { SQLiteSpecStore } from "./storage/sqlite";
import { PostgreSQLSpecStore } from "./storage/postgresql";

export interface RunningServer {
  app: ReturnType<typeof createApp>;
  store: SQLiteSpecStore | PostgreSQLSpecStore;
  server: ServerType;
}

export async function startServer(userConfig?: Partial<ServerConfig>): Promise<RunningServer> {
  const config: ServerConfig = { ...defaultConfig, ...userConfig };

  let store: SQLiteSpecStore | PostgreSQLSpecStore;

  if (config.database === "postgresql") {
    if (!config.postgresUrl) {
      throw new Error("PostgreSQL database requested but no postgresUrl provided.");
    }
    store = new PostgreSQLSpecStore(config.postgresUrl);
  } else {
    const sqlitePath =
      config.sqlitePath ??
      path.join(
        process.env.HOME || process.env.USERPROFILE || ".",
        ".grapity",
        "registry.db"
      );

    const dir = path.dirname(sqlitePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    store = new SQLiteSpecStore(sqlitePath);
  }

  await store.migrate();

  const app = createApp(config, store);

  const server = serve({
    fetch: app.fetch,
    port: config.port,
  });

  return { app, store, server };
}

export type { ServerConfig };
