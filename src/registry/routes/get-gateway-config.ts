import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayService } from "../services/gateway";

export const getGatewayConfigRoute = new Hono<AppEnv>().get("/:name", async (c) => {
  const name = c.req.param("name");
  const store = c.get("store");
  const service = new GatewayService(store, store);

  const config = await service.getGatewayConfig(name);
  if (!config) {
    return c.json({ error: "not_found", message: `Gateway config "${name}" not found`, statusCode: 404 }, 404);
  }

  return c.json({ data: config });
});
