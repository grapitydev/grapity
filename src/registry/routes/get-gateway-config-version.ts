import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayService } from "../services/gateway";

export const getGatewayConfigVersionRoute = new Hono<AppEnv>().get(
  "/:name/versions/:version",
  async (c) => {
    const name = c.req.param("name");
    const versionId = c.req.param("version");
    const store = c.get("store");
    const service = new GatewayService(store, store);

    const version = await service.getGatewayConfigVersion(name, versionId);
    if (!version) {
      return c.json({ error: "not_found", message: `Version ${versionId} not found for gateway config "${name}"`, statusCode: 404 }, 404);
    }

    return c.json({ data: version });
  }
);
