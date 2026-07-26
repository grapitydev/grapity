import { startServer } from "registry/serve";
import type { ServerConfig } from "registry/config";
import { startHubServer } from "hub/serve";
import { registryEnvSchema, hubEnvSchema } from "./env";

function formatIssues(error: { issues: { path: (string | number)[]; message: string }[] }): string {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
}

async function startRegistry(): Promise<void> {
  const parsed = registryEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid registry environment variables:\n${formatIssues(parsed.error)}`);
  }
  const env = parsed.data;

  const auth: ServerConfig["auth"] =
    env.GRAPITY_AUTH_MODE === "keycloak"
      ? {
          mode: "keycloak",
          serverUrl: env.GRAPITY_KEYCLOAK_SERVER_URL!.replace(/\/$/, ""),
          realm: env.GRAPITY_KEYCLOAK_REALM!,
          audience: env.GRAPITY_KEYCLOAK_AUDIENCE,
          roleSource: env.GRAPITY_KEYCLOAK_ROLE_SOURCE,
        }
      : { mode: "none" };

  const isPostgres =
    env.GRAPITY_DATABASE_URL.startsWith("postgresql://") ||
    env.GRAPITY_DATABASE_URL.startsWith("postgres://");

  const corsOrigins = env.GRAPITY_CORS_ORIGINS?.trim()
    ? env.GRAPITY_CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : undefined;

  const { server } = await startServer({
    port: env.GRAPITY_REGISTRY_PORT,
    hostname: env.GRAPITY_REGISTRY_HOSTNAME,
    database: isPostgres ? "postgresql" : "sqlite",
    postgresUrl: isPostgres ? env.GRAPITY_DATABASE_URL : undefined,
    sqlitePath: isPostgres ? undefined : env.GRAPITY_DATABASE_URL,
    auth,
    corsOrigins,
  });

  console.log(
    `Registry listening on http://${env.GRAPITY_REGISTRY_HOSTNAME}:${env.GRAPITY_REGISTRY_PORT}`
  );

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

async function startHub(): Promise<void> {
  const parsed = hubEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid hub environment variables:\n${formatIssues(parsed.error)}`);
  }
  const env = parsed.data;

  const hubAuth =
    env.GRAPITY_KEYCLOAK_SERVER_URL && env.GRAPITY_KEYCLOAK_REALM && env.GRAPITY_KEYCLOAK_HUB_CLIENT_ID
      ? {
          mode: "keycloak" as const,
          serverUrl: env.GRAPITY_KEYCLOAK_SERVER_URL.replace(/\/$/, ""),
          realm: env.GRAPITY_KEYCLOAK_REALM,
          clientId: env.GRAPITY_KEYCLOAK_HUB_CLIENT_ID,
          audience: env.GRAPITY_KEYCLOAK_AUDIENCE,
        }
      : undefined;

  await startHubServer({
    port: env.GRAPITY_HUB_PORT,
    proxyRegistryUrl: env.GRAPITY_REGISTRY_URL,
    auth: hubAuth,
  });

  console.log(`Hub listening on http://0.0.0.0:${env.GRAPITY_HUB_PORT}`);

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    process.exit(0);
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

async function main(): Promise<void> {
  const service = process.env.GRAPITY_SERVICE ?? "registry";

  if (service === "registry") {
    await startRegistry();
  } else if (service === "hub") {
    await startHub();
  } else {
    throw new Error(`Unknown GRAPITY_SERVICE value: ${service}. Expected "registry" or "hub".`);
  }
}

main().catch((err) => {
  console.error("Server entrypoint failed:", err);
  process.exit(1);
});
