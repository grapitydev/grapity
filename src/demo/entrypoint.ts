import { startServer } from "registry/serve";
import type { ServerConfig } from "registry/config";
import { startHubServer } from "hub/serve";
import { demoEnvSchema } from "./types";

async function main() {
  const parseResult = demoEnvSchema.safeParse(process.env);
  if (!parseResult.success) {
    const issues = parseResult.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid demo environment variables:\n${issues}`);
  }

  const env = parseResult.data;

  const registryAuth: ServerConfig["auth"] = {
    mode: "keycloak",
    serverUrl: env.GRAPITY_KEYCLOAK_SERVER_URL.replace(/\/$/, ""),
    realm: env.GRAPITY_KEYCLOAK_REALM,
    audience: env.GRAPITY_KEYCLOAK_AUDIENCE,
    roleSource: env.GRAPITY_KEYCLOAK_ROLE_SOURCE,
  };

  const registryConfig: Partial<ServerConfig> = {
    port: env.GRAPITY_REGISTRY_PORT,
    hostname: env.GRAPITY_REGISTRY_PUBLIC_URL ? "0.0.0.0" : "127.0.0.1",
    database: "sqlite",
    sqlitePath: env.GRAPITY_DATABASE_PATH,
    auth: registryAuth,
    corsOrigins: env.GRAPITY_REGISTRY_PUBLIC_URL
      ? [env.GRAPITY_PUBLIC_URL]
      : undefined,
  };

  const { server: registryServer, store } = await startServer(registryConfig);
  const registryBindHost = env.GRAPITY_REGISTRY_PUBLIC_URL ? "0.0.0.0" : "127.0.0.1";
  console.log(`Registry listening on http://${registryBindHost}:${env.GRAPITY_REGISTRY_PORT}`);

  await startHubServer({
    port: env.GRAPITY_HUB_PORT,
    registryUrl: env.GRAPITY_REGISTRY_PUBLIC_URL
      ? env.GRAPITY_REGISTRY_PUBLIC_URL
      : `http://127.0.0.1:${env.GRAPITY_REGISTRY_PORT}`,
    publicRegistryUrl: env.GRAPITY_REGISTRY_PUBLIC_URL,
    auth: {
      mode: "keycloak",
      serverUrl: registryAuth.serverUrl,
      realm: registryAuth.realm,
      clientId: env.GRAPITY_KEYCLOAK_HUB_CLIENT_ID,
      audience: registryAuth.audience,
    },
  });
  console.log(`Hub listening on http://0.0.0.0:${env.GRAPITY_HUB_PORT}`);

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    registryServer.close(async () => {
      if ("end" in store && typeof store.end === "function") {
        await store.end();
      }
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("Demo entrypoint failed:", err);
  process.exit(1);
});
