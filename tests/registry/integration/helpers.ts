import { Pool } from "pg";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import { createApp } from "registry/server";
import { PostgreSQLSpecStore } from "registry/storage/postgresql";

export async function createTestApp() {
  const container = await new PostgreSqlContainer("postgres:16")
    .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
    .start();
  const connectionUri = container.getConnectionUri();
  const store = new PostgreSQLSpecStore(connectionUri);
  await store.migrate();

  const pool = new Pool({ connectionString: connectionUri });
  const config = { port: 3750 };
  const app = createApp(config, store);

  async function reset() {
    await pool.query("TRUNCATE specs, spec_versions, audit_log, gateway_configs, gateway_config_versions, provisions, http_logs CASCADE");
  }

  async function cleanup() {
    await pool.end();
    await store.end();
    await container.stop();
  }

  return { app, store, reset, cleanup };
}

export function makeSpec(overrides: {
  paths?: Record<string, unknown>;
  title?: string;
  info?: Record<string, unknown>;
  servers?: any[];
  security?: any[];
  tags?: any[];
  webhooks?: Record<string, unknown>;
  externalDocs?: any;
  components?: Record<string, unknown>;
} = {}): string {
  const paths = overrides.paths ?? {
    "/payments/{id}": {
      get: {
        operationId: "getPayment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Payment details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    amount: { type: "number" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  const spec: Record<string, any> = {
    openapi: "3.1.0",
    info: overrides.info ?? { title: overrides.title ?? "Test API", version: "1.0.0" },
    paths,
  };

  if (overrides.servers !== undefined) spec.servers = overrides.servers;
  if (overrides.security !== undefined) spec.security = overrides.security;
  if (overrides.tags !== undefined) spec.tags = overrides.tags;
  if (overrides.webhooks !== undefined) spec.webhooks = overrides.webhooks;
  if (overrides.externalDocs !== undefined) spec.externalDocs = overrides.externalDocs;
  if (overrides.components !== undefined) spec.components = overrides.components;

  return JSON.stringify(spec);
}

export async function pushSpec(
  app: ReturnType<typeof createApp>,
  body: Record<string, unknown>
) {
  const res = await app.request("/v1/specs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json() };
}
