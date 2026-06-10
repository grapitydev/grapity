import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayLogService } from "../services/gateway-log";

export const gatewayLogStatsRoute = new Hono<AppEnv>().get("/stats", async (c) => {
  const store = c.get("store");
  const service = new GatewayLogService(store);

  const filters = {
    gatewayConfigName: c.req.query("gatewayConfig") ?? undefined,
    environment: c.req.query("environment") ?? undefined,
    from: c.req.query("from") ? new Date(c.req.query("from")!) : undefined,
    to: c.req.query("to") ? new Date(c.req.query("to")!) : undefined,
  };

  const stats = await service.getStats(filters);

  return c.json({
    data: stats.map((s) => ({
      gatewayConfigName: s.gatewayConfigName,
      environment: s.environment,
      method: s.method,
      routePath: s.routePath,
      lastSeenAt: s.lastSeenAt.toISOString(),
      totalCalls: s.totalCalls,
      uniqueCallerIds: s.uniqueCallerIds,
    })),
  });
});
