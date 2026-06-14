import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import type { SpecStore, GatewayConfigStore } from "core";
import { pushRoute } from "./routes/push";
import { validateRoute } from "./routes/validate";
import { listRoute } from "./routes/list";
import { getSpecRoute } from "./routes/get-spec";
import { deleteSpecRoute } from "./routes/delete-spec";
import { versionsRoute } from "./routes/versions";
import { getVersionRoute } from "./routes/get-version";
import { compatReportRoute } from "./routes/compat-report";
import { compareVersionsRoute } from "./routes/compare-versions";
import { serveSpecRoute } from "./routes/serve-spec";
import { healthRoute } from "./routes/health";
import { welcomeRoute } from "./routes/welcome";
import { pushGatewayConfigRoute } from "./routes/push-gateway-config";
import { listGatewayConfigsRoute } from "./routes/list-gateway-configs";
import { getGatewayConfigRoute } from "./routes/get-gateway-config";
import { gatewayConfigVersionsRoute } from "./routes/gateway-config-versions";
import { getGatewayConfigVersionRoute } from "./routes/get-gateway-config-version";
import { ingestGatewayLogRoute } from "./routes/ingest-gateway-log";
import { listGatewayLogsRoute } from "./routes/list-gateway-logs";
import { getGatewayLogRoute } from "./routes/get-gateway-log";
import { gatewayLogStatsRoute } from "./routes/gateway-log-stats";
import type { ServerConfig } from "./config";
import { createAuthMiddleware, parseRouteScopes, AuthError } from "./auth/middleware";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";

function loadOpenApiSpec(): Record<string, unknown> {
  const path = fileURLToPath(new URL("../../openapi.yaml", import.meta.url));
  const content = readFileSync(path, "utf-8");
  return yaml.load(content) as Record<string, unknown>;
}

export type AppEnv = {
  Variables: {
    store: SpecStore & GatewayConfigStore;
    config: ServerConfig;
    actor?: string;
    claims?: Record<string, unknown>;
  };
};

export function createApp(config: ServerConfig, store: SpecStore & GatewayConfigStore) {
  const app = new Hono<AppEnv>();

  app.use("*", logger());
  app.use("*", cors());
  app.use("*", prettyJSON());

  app.use("*", async (c, next) => {
    c.set("store", store);
    c.set("config", config);
    await next();
  });

  const routeScopes = parseRouteScopes(loadOpenApiSpec());
  app.use("*", createAuthMiddleware(config, routeScopes));

  app.onError((err, c) => {
    if (err instanceof AuthError) {
      return c.json(
        { error: err.code, message: err.message, statusCode: err.statusCode },
        err.statusCode as 401 | 403
      );
    }
    console.error("Unhandled error:", err);
    return c.json(
      { error: "internal_error", message: "Internal server error", statusCode: 500 },
      500
    );
  });

  app.route("/v1/specs", pushRoute);
  app.route("/v1/specs", validateRoute);
  app.route("/v1/specs", listRoute);
  app.route("/v1/specs", getSpecRoute);
  app.route("/v1/specs", deleteSpecRoute);
  app.route("/v1/specs", versionsRoute);
  app.route("/v1/specs", getVersionRoute);
  app.route("/v1/specs", serveSpecRoute);
  app.route("/v1/specs", compatReportRoute);
  app.route("/v1/specs", compareVersionsRoute);
  app.route("/v1/gateway-configs", pushGatewayConfigRoute);
  app.route("/v1/gateway-configs", listGatewayConfigsRoute);
  app.route("/v1/gateway-configs", getGatewayConfigRoute);
  app.route("/v1/gateway-configs", gatewayConfigVersionsRoute);
  app.route("/v1/gateway-configs", getGatewayConfigVersionRoute);
  app.route("/v1/gateway-logs", ingestGatewayLogRoute);
  app.route("/v1/gateway-logs", listGatewayLogsRoute);
  app.route("/v1/gateway-logs", gatewayLogStatsRoute);
  app.route("/v1/gateway-logs", getGatewayLogRoute);
  app.route("/v1/health", healthRoute);
  app.route("/", welcomeRoute);

  return app;
}

export { Hono };
export type { ServerConfig } from "./config";
