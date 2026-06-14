import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { Wait } from "testcontainers";
import { startServer } from "registry/serve";
import { DatabaseConnectionError } from "registry/storage/postgresql";
import type { ServerConfig } from "registry/config";

describe("startServer with postgresql database", () => {
  let container: Awaited<ReturnType<InstanceType<typeof PostgreSqlContainer>["start"]>>;
  let connectionUri: string;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16")
      .withWaitStrategy(Wait.forLogMessage("database system is ready to accept connections", 2))
      .start();
    connectionUri = container.getConnectionUri();
  }, 120_000);

  afterAll(async () => {
    await container.stop();
  });

  it("starts the registry against PostgreSQL and serves health endpoint", async () => {
    const config: ServerConfig = {
      port: 0,
      database: "postgresql",
      postgresUrl: connectionUri,
      auth: { mode: "none" },
    };

    const { app } = await startServer(config);

    const res = await app.request("/v1/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("ok");
  }, 120_000);

  it("throws a DatabaseConnectionError when PostgreSQL is not reachable", async () => {
    const config: ServerConfig = {
      port: 0,
      database: "postgresql",
      postgresUrl: "postgresql://grapity:grapity@127.0.0.1:1/grapity",
      auth: { mode: "none" },
    };

    await expect(startServer(config)).rejects.toBeInstanceOf(DatabaseConnectionError);
  });
});
