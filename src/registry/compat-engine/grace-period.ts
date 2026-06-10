import type { RawChange } from "./differ";

export type GraceViolationRule =
  | "endpoint-removed-without-deprecation"
  | "endpoint-removed-missing-sunset"
  | "endpoint-removed-before-sunset"
  | "param-removed-without-deprecation"
  | "param-removed-missing-sunset"
  | "param-removed-before-sunset"
  | "request-body-property-removed-without-deprecation"
  | "request-body-property-removed-missing-sunset"
  | "request-body-property-removed-before-sunset"
  | "response-property-removed-without-deprecation"
  | "response-property-removed-missing-sunset"
  | "response-property-removed-before-sunset";

export interface GraceViolation {
  path: string;
  method: string;
  rule: GraceViolationRule;
  xSunset?: string;
  paramName?: string;
  paramIn?: string;
  statusCode?: string;
  propertyPath?: string;
}

export function checkGracePeriod(changes: RawChange[]): GraceViolation[] {
  const violations: GraceViolation[] = [];
  const now = new Date();

  for (const change of changes) {
    if (change.type === "endpoint-removed" && change.wasDraft) continue;
    if (change.type === "param-removed" && change.wasDraft) continue;
    if (change.type === "request-body-property-removed" && change.wasDraft) continue;
    if (change.type === "response-property-removed" && change.wasDraft) continue;

    if (change.type === "endpoint-removed") {
      if (!change.wasDeprecated) {
        violations.push({ path: change.path, method: change.method, rule: "endpoint-removed-without-deprecation" });
        continue;
      }

      if (!change.xSunset) {
        violations.push({ path: change.path, method: change.method, rule: "endpoint-removed-missing-sunset" });
        continue;
      }

      const sunsetDate = new Date(change.xSunset);
      if (isNaN(sunsetDate.getTime()) || sunsetDate >= now) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "endpoint-removed-before-sunset",
          xSunset: change.xSunset,
        });
      }
      continue;
    }

    if (change.type === "param-removed") {
      if (!change.wasDeprecated) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "param-removed-without-deprecation",
          paramName: change.paramName,
          paramIn: change.paramIn,
        });
        continue;
      }

      if (!change.xSunset) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "param-removed-missing-sunset",
          paramName: change.paramName,
          paramIn: change.paramIn,
        });
        continue;
      }

      const sunsetDate = new Date(change.xSunset);
      if (isNaN(sunsetDate.getTime()) || sunsetDate >= now) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "param-removed-before-sunset",
          xSunset: change.xSunset,
          paramName: change.paramName,
          paramIn: change.paramIn,
        });
      }
      continue;
    }

    if (change.type === "request-body-property-removed") {
      if (!change.wasDeprecated) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "request-body-property-removed-without-deprecation",
          propertyPath: change.propertyPath,
        });
        continue;
      }

      if (!change.xSunset) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "request-body-property-removed-missing-sunset",
          propertyPath: change.propertyPath,
        });
        continue;
      }

      const sunsetDate = new Date(change.xSunset);
      if (isNaN(sunsetDate.getTime()) || sunsetDate >= now) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "request-body-property-removed-before-sunset",
          xSunset: change.xSunset,
          propertyPath: change.propertyPath,
        });
      }
      continue;
    }

    if (change.type === "response-property-removed") {
      if (!change.wasDeprecated) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "response-property-removed-without-deprecation",
          statusCode: change.statusCode,
          propertyPath: change.propertyPath,
        });
        continue;
      }

      if (!change.xSunset) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "response-property-removed-missing-sunset",
          statusCode: change.statusCode,
          propertyPath: change.propertyPath,
        });
        continue;
      }

      const sunsetDate = new Date(change.xSunset);
      if (isNaN(sunsetDate.getTime()) || sunsetDate >= now) {
        violations.push({
          path: change.path,
          method: change.method,
          rule: "response-property-removed-before-sunset",
          xSunset: change.xSunset,
          statusCode: change.statusCode,
          propertyPath: change.propertyPath,
        });
      }
      continue;
    }
  }

  return violations;
}
