import fs from "node:fs";
import path from "node:path";
import openapiTS, { astToString } from "openapi-typescript";
import ts from "typescript";
import yaml from "js-yaml";

const DATE = ts.factory.createTypeReferenceNode(
  ts.factory.createIdentifier("Date")
);

const ast = await openapiTS(new URL("../openapi.yaml", import.meta.url), {
  transform(schemaObject) {
    if (schemaObject.format === "date-time") {
      return DATE;
    }
  },
});

const contents = astToString(ast);
fs.writeFileSync(
  new URL("../src/core/generated/api.ts", import.meta.url),
  contents
);
console.log("Generated types written to src/core/generated/api.ts");

interface RouteScope {
  method: string;
  path: string;
  operationId: string;
  scopes: string[];
}

function generateRouteScopes(spec: Record<string, unknown>): RouteScope[] {
  const routes: RouteScope[] = [];
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  if (!paths) return routes;

  for (const [rawPath, operations] of Object.entries(paths)) {
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
        path: rawPath.replace(/\{([^}]+)\}/g, ":$1"),
        operationId,
        scopes,
      });
    }
  }

  return routes;
}

function writeRouteScopes(): void {
  const specPath = new URL("../openapi.yaml", import.meta.url);
  const spec = yaml.load(fs.readFileSync(specPath, "utf-8")) as Record<string, unknown>;
  const routeScopes = generateRouteScopes(spec);

  const outputPath = new URL("../src/registry/generated/route-scopes.ts", import.meta.url);
  fs.mkdirSync(path.dirname(outputPath.pathname), { recursive: true });

  const lines = [
    "// Generated from openapi.yaml by scripts/generate-types.ts",
    "// Do not edit by hand.",
    "",
    "export interface RouteScope {",
    "  method: string;",
    "  path: string;",
    "  operationId: string;",
    "  scopes: string[];",
    "}",
    "",
    "export const routeScopes: RouteScope[] = " +
      JSON.stringify(routeScopes, null, 2) +
      ";",
    "",
  ];

  fs.writeFileSync(outputPath, lines.join("\n"));
  console.log("Generated route scopes written to src/registry/generated/route-scopes.ts");
}

writeRouteScopes();
