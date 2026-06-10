import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayLogService } from "../services/gateway-log";

export const getGatewayLogRoute = new Hono<AppEnv>().get("/:id", async (c) => {
  const store = c.get("store");
  const service = new GatewayLogService(store);
  const id = c.req.param("id");

  const log = await service.getLog(id);
  if (!log) {
    return c.json({ error: "not_found", message: "Log not found", statusCode: 404 }, 404);
  }

  return c.json({ data: log });
});
