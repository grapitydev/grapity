import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayService } from "../services/gateway";
import type { GatewayConfigVersion } from "core";

function withoutContent({ content: _, ...rest }: GatewayConfigVersion) {
  return rest;
}

export const gatewayConfigVersionsRoute = new Hono<AppEnv>().get(
  "/:name/versions",
  async (c) => {
    const name = c.req.param("name");
    const store = c.get("store");
    const service = new GatewayService(store, store);

    const versions = await service.listGatewayConfigVersions(name);
    return c.json({ data: versions.map(withoutContent) });
  }
);
