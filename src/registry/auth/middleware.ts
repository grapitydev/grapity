import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { Context, MiddlewareHandler, Next } from "hono";
import type { AppEnv } from "../server";
import type { ServerConfig } from "../config";

export interface AuthContext {
  actor: string;
  claims: JWTPayload;
}

interface OperationScope {
  operationId: string;
  scopes: string[];
}

interface RouteInfo {
  method: string;
  path: string;
  operationId: string;
  scopes: string[];
}

export class AuthError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function buildKeycloakUrls(config: {
  serverUrl: string;
  realm: string;
}) {
  const base = `${config.serverUrl}/realms/${config.realm}`;
  return {
    issuer: base,
    jwksUri: `${base}/protocol/openid-connect/certs`,
    tokenUrl: `${base}/protocol/openid-connect/token`,
  };
}

export function createAuthMiddleware(
  config: ServerConfig,
  routeScopes: RouteInfo[]
): MiddlewareHandler<AppEnv> {
  if (config.auth?.mode !== "keycloak") {
    return async (_c, next) => await next();
  }

  const authConfig = config.auth;
  const { issuer, jwksUri } = buildKeycloakUrls(authConfig);
  const jwks = createRemoteJWKSet(new URL(jwksUri));

  const scopeByRoute = new Map<string, OperationScope>();
  for (const route of routeScopes) {
    const key = `${route.method.toUpperCase()}:${route.path}`;
    scopeByRoute.set(key, {
      operationId: route.operationId,
      scopes: route.scopes,
    });
  }

  return async (c, next) => {
    const matchedPath = c.req.matchedRoutes
      .map((r) => r.path)
      .filter((p) => p !== "/*")
      .pop();
    const routeKey = matchedPath ? `${c.req.method}:${matchedPath}` : `${c.req.method}:${c.req.routePath}`;
    const required = scopeByRoute.get(routeKey);

    if (!required || required.scopes.length === 0) {
      return await next();
    }

    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthError(401, "unauthorized", "Bearer token required");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      throw new AuthError(401, "unauthorized", "Bearer token required");
    }

    let payload: JWTPayload;
    try {
      const result = await jwtVerify(token, jwks, {
        issuer,
        audience: authConfig.audience,
      });
      payload = result.payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid token";
      throw new AuthError(401, "unauthorized", `Invalid or expired token: ${message}`);
    }

    const subject = payload.sub;
    if (!subject) {
      throw new AuthError(401, "unauthorized", "Token missing subject claim");
    }

    const grantedScopes = extractScopes(payload, authConfig.roleSource ?? "scope");

    const missing = required.scopes.filter((s) => !grantedScopes.has(s));
    if (missing.length > 0) {
      throw new AuthError(
        403,
        "forbidden",
        `Missing required scope${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`
      );
    }

    c.set("actor", subject);
    c.set("claims", payload);

    await next();
  };
}

function extractScopes(
  payload: JWTPayload,
  source: "scope" | "realm_access.roles"
): Set<string> {
  if (source === "realm_access.roles") {
    const roles = (payload.realm_access as { roles?: string[] } | undefined)?.roles;
    return new Set(roles ?? []);
  }

  const scopeValue = payload.scope;
  if (typeof scopeValue === "string") {
    return new Set(scopeValue.split(/\s+/).filter(Boolean));
  }
  return new Set();
}

export function parseRouteScopes(spec: Record<string, unknown>): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return routes;

  for (const [path, operations] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(operations)) {
      if (typeof operation !== "object" || operation === null) continue;
      const op = operation as Record<string, unknown>;
      const operationId = op.operationId as string | undefined;
      if (!operationId) continue;

      const security = op.security as Array<Record<string, string[]>> | undefined;
      const scopes: string[] = [];
      if (security) {
        for (const sec of security) {
          for (const [name, required] of Object.entries(sec)) {
            if (name === "keycloak" && Array.isArray(required)) {
              scopes.push(...required);
            }
          }
        }
      }

      routes.push({
        method: method.toUpperCase(),
        path: path.replace(/\{([^}]+)\}/g, ":$1"),
        operationId,
        scopes,
      });
    }
  }

  return routes;
}
