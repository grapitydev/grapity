import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayLogService } from "../services/gateway-log";

export const ingestGatewayLogRoute = new Hono<AppEnv>().post("/ingest/:provider/:environment", async (c) => {
  const store = c.get("store");
  const service = new GatewayLogService(store);
  const provider = c.req.param("provider");
  const environment = c.req.param("environment");

  try {
    const payload = await c.req.json();
    await service.ingestLog(provider, environment, payload);
    return c.json({ status: "ok" }, 201);
  } catch (err) {
    return c.json({
      error: "bad_request",
      message: err instanceof Error ? err.message : "Invalid log payload",
      statusCode: 400,
    }, 400);
  }
});
