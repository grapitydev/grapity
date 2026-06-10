import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayService } from "../services/gateway";

export const listGatewayConfigsRoute = new Hono<AppEnv>().get("/", async (c) => {
  const store = c.get("store");
  const service = new GatewayService(store, store);
  const configs = await service.listGatewayConfigs();
  return c.json({ data: configs });
});
