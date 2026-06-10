import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayLogService } from "../services/gateway-log";

export const listGatewayLogsRoute = new Hono<AppEnv>().get("/", async (c) => {
  const store = c.get("store");
  const service = new GatewayLogService(store);

  const filters = {
    gatewayConfigName: c.req.query("gatewayConfig") ?? undefined,
    environment: c.req.query("environment") ?? undefined,
    path: c.req.query("path") ?? undefined,
    method: c.req.query("method") ?? undefined,
    status: c.req.query("status") ? parseInt(c.req.query("status")!, 10) : undefined,
    from: c.req.query("from") ? new Date(c.req.query("from")!) : undefined,
    to: c.req.query("to") ? new Date(c.req.query("to")!) : undefined,
    limit: c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : undefined,
    offset: c.req.query("offset") ? parseInt(c.req.query("offset")!, 10) : undefined,
  };

  const result = await service.listLogs(filters);

  return c.json({
    data: result.logs,
    pagination: {
      total: result.total,
      limit: filters.limit ?? 50,
      offset: filters.offset ?? 0,
      hasMore: (filters.offset ?? 0) + (filters.limit ?? 50) < result.total,
    },
  });
});
