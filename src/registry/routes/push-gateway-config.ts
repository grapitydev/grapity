import { Hono } from "hono";
import type { AppEnv } from "../server";
import { GatewayService, UnsupportedProviderError, SpecNotFoundError, RouteNotFoundError, NoEnvironmentsError, NameExistsError } from "../services/gateway";
type PushBody = {
  name?: string;
  provider?: string;
  specName?: string;
  specSemver?: string;
  routes?: { path: string; methods: string[] }[];
  environments?: Record<string, { kongAddr: string; upstream: string; plugins: { name: string; config: Record<string, unknown>; order?: number }[] }>;
  callerIdentification?: { strategy: "first-match"; rules: { source: string; confidence: "high" | "medium" | "low" | "anonymous" }[] };
  content?: string;
  pushedBy?: string;
};

export const pushGatewayConfigRoute = new Hono<AppEnv>().post("/", async (c) => {
  let body: PushBody;

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "bad_request", message: "Request body must be valid JSON", statusCode: 400 }, 400);
  }

  if (!body.name || typeof body.name !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: name", statusCode: 400 }, 400);
  }
  if (!body.provider || typeof body.provider !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: provider", statusCode: 400 }, 400);
  }
  if (!body.specName || typeof body.specName !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: specName", statusCode: 400 }, 400);
  }
  if (!body.specSemver || typeof body.specSemver !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: specSemver", statusCode: 400 }, 400);
  }
  if (!body.content || typeof body.content !== "string") {
    return c.json({ error: "bad_request", message: "Missing required field: content", statusCode: 400 }, 400);
  }

  const store = c.get("store");
  const service = new GatewayService(store, store);

  const actor = c.get("actor") ?? body.pushedBy;

  try {
    const result = await service.pushGatewayConfig({
      name: body.name,
      provider: body.provider,
      specName: body.specName,
      specSemver: body.specSemver,
      routes: Array.isArray(body.routes) ? body.routes : [],
      environments: body.environments as Record<string, any> ?? {},
      callerIdentification: body.callerIdentification,
      content: body.content,
      pushedBy: actor,
    });
    return c.json({ data: result }, 201);
  } catch (err) {
    if (err instanceof UnsupportedProviderError) {
      return c.json({ error: "unsupported_provider", message: err.message, statusCode: 422 }, 422);
    }
    if (err instanceof SpecNotFoundError) {
      return c.json({ error: "spec_not_found", message: err.message, statusCode: 422 }, 422);
    }
    if (err instanceof RouteNotFoundError) {
      return c.json({ error: "route_not_found", message: err.message, statusCode: 422 }, 422);
    }
    if (err instanceof NoEnvironmentsError) {
      return c.json({ error: "no_environments", message: err.message, statusCode: 422 }, 422);
    }
    if (err instanceof NameExistsError) {
      return c.json({ error: "name_exists", message: err.message, statusCode: 409 }, 409);
    }
    console.error("Push gateway config error:", err);
    return c.json({
      error: "internal_error",
      message: err instanceof Error ? err.message : "An unexpected error occurred",
      statusCode: 500,
    }, 500);
  }
});
