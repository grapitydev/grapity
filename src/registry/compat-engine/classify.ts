import { v4 as uuid } from "uuid";
import type { CompatReport, BreakingChange, SafeChange, VersionClassification } from "core";
import type { RawChange } from "./differ";
import type { GraceViolation } from "./grace-period";

export interface ClassifyResult {
  compatReport: CompatReport;
  hasGraceViolations: boolean;
}

export function classifyChanges(
  changes: RawChange[],
  graceViolations: GraceViolation[],
  previousVersion: string,
): ClassifyResult {
  const breakingChanges: BreakingChange[] = [];
  const safeChanges: SafeChange[] = [];
  let hasGraceViolations = false;

  const violationByKey = new Map<string, GraceViolation>();
  for (const v of graceViolations) {
    let key = `${v.path}:${v.method}`;
    if (v.paramName && v.paramIn) {
      key = `${key}:param:${v.paramIn}:${v.paramName}`;
    } else if (v.statusCode && v.propertyPath) {
      key = `${key}:response:${v.statusCode}:${v.propertyPath}`;
    } else if (v.propertyPath) {
      key = `${key}:request-body:${v.propertyPath}`;
    }
    violationByKey.set(key, v);
  }

  for (const change of changes) {
    switch (change.type) {
      case "stable-endpoint-marked-draft":
        breakingChanges.push({
          id: uuid(),
          rule: "stable-endpoint-marked-draft",
          description: `${change.method.toUpperCase()} ${change.path} cannot be downgraded from stable to draft`,
          path: `${change.path}/${change.method.toUpperCase()}`,
          category: "structural",
        });
        break;

      case "endpoint-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `${change.method.toUpperCase()} ${change.path} was removed (endpoint was marked x-draft)`,
            path: `${change.path}/${change.method.toUpperCase()}`,
            category: "documentation",
          });
          break;
        }
        const violation = violationByKey.get(`${change.path}:${change.method}`);
        if (violation) {
          hasGraceViolations = true;
          breakingChanges.push({
            id: uuid(),
            rule: violation.rule,
            description: describeGraceViolation(change.path, change.method, violation),
            path: `${change.path}/${change.method.toUpperCase()}`,
            category: "structural",
            originalValue: "endpoint existed",
            newValue: "endpoint removed",
          });
        } else {
          breakingChanges.push({
            id: uuid(),
            rule: "endpoint-removed",
            description: `${change.method.toUpperCase()} ${change.path} was removed after sunset on ${change.xSunset ?? "unknown"}`,
            path: `${change.path}/${change.method.toUpperCase()}`,
            category: "structural",
            originalValue: "endpoint existed",
            newValue: "endpoint removed",
          });
        }
        break;
      }

      case "endpoint-added":
        safeChanges.push({
          id: uuid(),
          rule: "endpoint-added",
          description: `${change.method.toUpperCase()} ${change.path} was added`,
          path: `${change.path}/${change.method.toUpperCase()}`,
          category: "structural",
        });
        break;

      case "endpoint-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "endpoint-deprecated",
          description: `${change.method.toUpperCase()} ${change.path} was marked deprecated${change.xSunset ? ` (sunset: ${change.xSunset})` : ""}`,
          path: `${change.path}/${change.method.toUpperCase()}`,
          category: "structural",
        });
        break;

      case "endpoint-un-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "endpoint-un-deprecated",
          description: `${change.method.toUpperCase()} ${change.path} was un-deprecated`,
          path: `${change.path}/${change.method.toUpperCase()}`,
          category: "documentation",
        });
        break;

      case "draft-endpoint-marked-stable":
        safeChanges.push({
          id: uuid(),
          rule: "draft-endpoint-marked-stable",
          description: `${change.method.toUpperCase()} ${change.path} was promoted from draft to stable`,
          path: `${change.path}/${change.method.toUpperCase()}`,
          category: "documentation",
        });
        break;

      case "required-param-added":
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Required ${change.paramIn} parameter '${change.paramName}' was added to draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "required-request-param-added",
          description: `Required ${change.paramIn} parameter '${change.paramName}' was added to ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "structural",
        });
        break;

      case "optional-param-added":
        safeChanges.push({
          id: uuid(),
          rule: "optional-request-param-added",
          description: `Optional ${change.paramIn} parameter '${change.paramName}' was added to ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "structural",
        });
        break;

      case "param-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `${change.method.toUpperCase()} ${change.path}: ${change.paramIn} parameter '${change.paramName}' was removed from draft endpoint`,
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
            category: "documentation",
          });
          break;
        }
        const violation = violationByKey.get(`${change.path}:${change.method}:param:${change.paramIn}:${change.paramName}`);
        if (violation) {
          hasGraceViolations = true;
          breakingChanges.push({
            id: uuid(),
            rule: violation.rule,
            description: describeGraceViolation(change.path, change.method, violation, change.paramName, change.paramIn),
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
            category: "structural",
          });
        } else {
          breakingChanges.push({
            id: uuid(),
            rule: "param-removed",
            description: `${change.method.toUpperCase()} ${change.path}: ${change.paramIn} parameter '${change.paramName}' was removed after sunset on ${change.xSunset ?? "unknown"}`,
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
            category: "structural",
          });
        }
        break;
      }

      case "param-type-changed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `${change.paramIn} parameter '${change.paramName}' type changed from ${change.oldType} to ${change.newType} on draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "param-type-changed",
          description: `${change.paramIn} parameter '${change.paramName}' type changed from ${change.oldType} to ${change.newType} on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "structural",
        });
        break;
      }

      case "param-format-changed":
        safeChanges.push({
          id: uuid(),
          rule: "param-format-changed",
          description: `${change.paramIn} parameter '${change.paramName}' format changed from ${change.oldFormat} to ${change.newFormat} on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "documentation",
        });
        break;

      case "param-now-required": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `${change.paramIn} parameter '${change.paramName}' became required on draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "param-now-required",
          description: `${change.paramIn} parameter '${change.paramName}' became required on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "structural",
        });
        break;
      }

      case "param-now-optional":
        safeChanges.push({
          id: uuid(),
          rule: "param-now-optional",
          description: `${change.paramIn} parameter '${change.paramName}' became optional on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "documentation",
        });
        break;

      case "param-description-changed":
        safeChanges.push({
          id: uuid(),
          rule: "param-description-changed",
          description: `Description of ${change.paramIn} parameter '${change.paramName}' changed on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "documentation",
        });
        break;

      case "param-default-changed":
        safeChanges.push({
          id: uuid(),
          rule: "param-default-changed",
          description: `Default value of ${change.paramIn} parameter '${change.paramName}' changed on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "documentation",
        });
        break;

      case "param-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "param-deprecated",
          description: `${change.paramIn} parameter '${change.paramName}' was marked deprecated${change.xSunset ? ` (sunset: ${change.xSunset})` : ""} on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "structural",
        });
        break;

      case "param-un-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "param-un-deprecated",
          description: `${change.paramIn} parameter '${change.paramName}' was un-deprecated on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "documentation",
        });
        break;

      case "param-enum-value-added":
        safeChanges.push({
          id: uuid(),
          rule: "param-enum-value-added",
          description: `Enum value '${change.value}' added to ${change.paramIn} parameter '${change.paramName}' on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "structural",
        });
        break;

      case "param-enum-value-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Enum value '${change.value}' removed from ${change.paramIn} parameter '${change.paramName}' on draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "param-enum-value-removed",
          description: `Enum value '${change.value}' removed from ${change.paramIn} parameter '${change.paramName}' on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/parameters/${change.paramName}`,
          category: "structural",
        });
        break;
      }

      case "request-body-added":
        breakingChanges.push({
          id: uuid(),
          rule: "request-body-added",
          description: `Request body added to ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody`,
          category: "structural",
        });
        break;

      case "request-body-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Request body removed from draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/requestBody`,
            category: "documentation",
          });
          break;
        }
        safeChanges.push({
          id: uuid(),
          rule: "request-body-removed",
          description: `Request body removed from ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody`,
          category: "documentation",
        });
        break;
      }

      case "request-body-property-added":
        if (change.required) {
          if (change.wasDraft) {
            safeChanges.push({
              id: uuid(),
              rule: "draft-endpoint-changed",
              description: `Required request body property '${change.propertyPath}' added to draft endpoint ${change.method.toUpperCase()} ${change.path}`,
              path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
              category: "documentation",
            });
          } else {
            breakingChanges.push({
              id: uuid(),
              rule: "request-body-property-added",
              description: `Required request body property '${change.propertyPath}' added to ${change.method.toUpperCase()} ${change.path}`,
              path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
              category: "structural",
            });
          }
        } else {
          safeChanges.push({
            id: uuid(),
            rule: "request-body-property-added",
            description: `Optional request body property '${change.propertyPath}' added to ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
            category: "documentation",
          });
        }
        break;

      case "request-body-property-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `${change.method.toUpperCase()} ${change.path}: request body property '${change.propertyPath}' was removed from draft endpoint`,
            path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
            category: "documentation",
          });
          break;
        }
        const violation = violationByKey.get(`${change.path}:${change.method}:request-body:${change.propertyPath}`);
        if (violation) {
          hasGraceViolations = true;
          breakingChanges.push({
            id: uuid(),
            rule: violation.rule,
            description: describeGraceViolation(change.path, change.method, violation, undefined, undefined, change.propertyPath),
            path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
            category: "structural",
            originalValue: "property existed",
            newValue: "property removed",
          });
        } else {
          breakingChanges.push({
            id: uuid(),
            rule: "request-body-property-removed",
            description: `${change.method.toUpperCase()} ${change.path}: request body property '${change.propertyPath}' was removed after sunset on ${change.xSunset ?? "unknown"}`,
            path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
            category: "structural",
          });
        }
        break;
      }

      case "request-body-property-type-changed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Request body property '${change.propertyPath}' type changed from ${change.oldType} to ${change.newType} on draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "request-body-property-type-changed",
          description: `Request body property '${change.propertyPath}' type changed from ${change.oldType} to ${change.newType} on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
          category: "structural",
        });
        break;
      }

      case "request-body-property-now-required": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Request body property '${change.propertyPath}' became required on draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "request-body-property-now-required",
          description: `Request body property '${change.propertyPath}' became required on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
          category: "structural",
        });
        break;
      }

      case "request-body-property-now-optional":
        safeChanges.push({
          id: uuid(),
          rule: "request-body-property-now-optional",
          description: `Request body property '${change.propertyPath}' became optional on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
          category: "documentation",
        });
        break;

      case "request-body-property-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "request-body-property-deprecated",
          description: `Request body property '${change.propertyPath}' was marked deprecated${change.xSunset ? ` (sunset: ${change.xSunset})` : ""} on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
          category: "structural",
        });
        break;

      case "request-body-property-un-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "request-body-property-un-deprecated",
          description: `Request body property '${change.propertyPath}' was un-deprecated on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody/${change.propertyPath}`,
          category: "documentation",
        });
        break;

      case "request-body-media-type-changed":
        breakingChanges.push({
          id: uuid(),
          rule: "request-body-media-type-changed",
          description: `Request body media type changed from ${change.oldMediaType} to ${change.newMediaType} on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody`,
          category: "structural",
        });
        break;

      case "request-body-description-changed":
        safeChanges.push({
          id: uuid(),
          rule: "request-body-description-changed",
          description: `Request body description changed on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/requestBody`,
          category: "documentation",
        });
        break;

      case "response-property-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `${change.method.toUpperCase()} ${change.path}: response property '${change.propertyPath}' was removed from ${change.statusCode} response in draft endpoint`,
            path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
            category: "documentation",
          });
          break;
        }
        const violation = violationByKey.get(`${change.path}:${change.method}:response:${change.statusCode}:${change.propertyPath}`);
        if (violation) {
          hasGraceViolations = true;
          breakingChanges.push({
            id: uuid(),
            rule: violation.rule,
            description: describeGraceViolation(change.path, change.method, violation, undefined, undefined, change.propertyPath, change.statusCode),
            path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
            category: "structural",
            originalValue: change.originalValue,
            newValue: undefined,
          });
        } else {
          breakingChanges.push({
            id: uuid(),
            rule: "response-property-removed",
            description: `${change.method.toUpperCase()} ${change.path}: response property '${change.propertyPath}' was removed from ${change.statusCode} response after sunset on ${change.xSunset ?? "unknown"}`,
            path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
            category: "structural",
            originalValue: change.originalValue,
            newValue: undefined,
          });
        }
        break;
      }

      case "response-property-added":
        safeChanges.push({
          id: uuid(),
          rule: "response-property-added",
          description: `Response property '${change.propertyPath}' added to ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          category: "documentation",
        });
        break;

      case "response-property-type-changed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Response property '${change.propertyPath}' type changed from ${change.oldType} to ${change.newType} on draft endpoint ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
            path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "response-property-type-changed",
          description: `Response property '${change.propertyPath}' type changed from ${change.oldType} to ${change.newType} on ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          category: "structural",
        });
        break;
      }

      case "response-property-now-required": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Response property '${change.propertyPath}' became required on draft endpoint ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
            path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "response-property-now-required",
          description: `Response property '${change.propertyPath}' became required on ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          category: "structural",
        });
        break;
      }

      case "response-property-now-optional":
        safeChanges.push({
          id: uuid(),
          rule: "response-property-now-optional",
          description: `Response property '${change.propertyPath}' became optional on ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          category: "documentation",
        });
        break;

      case "response-property-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "response-property-deprecated",
          description: `Response property '${change.propertyPath}' was marked deprecated${change.xSunset ? ` (sunset: ${change.xSunset})` : ""} on ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          category: "structural",
        });
        break;

      case "response-property-un-deprecated":
        safeChanges.push({
          id: uuid(),
          rule: "response-property-un-deprecated",
          description: `Response property '${change.propertyPath}' was un-deprecated on ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/response/${change.statusCode}/${change.propertyPath}`,
          category: "documentation",
        });
        break;

      case "response-status-removed": {
        if (change.wasDraft) {
          safeChanges.push({
            id: uuid(),
            rule: "draft-endpoint-changed",
            description: `Response status ${change.statusCode} was removed from draft endpoint ${change.method.toUpperCase()} ${change.path}`,
            path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
            category: "documentation",
          });
          break;
        }
        breakingChanges.push({
          id: uuid(),
          rule: "response-status-removed",
          description: `Response status ${change.statusCode} was removed from ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
          category: "structural",
        });
        break;
      }

      case "response-status-added":
        safeChanges.push({
          id: uuid(),
          rule: "response-status-added",
          description: `Response status ${change.statusCode} was added to ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
          category: "structural",
        });
        break;

      case "response-media-type-changed":
        breakingChanges.push({
          id: uuid(),
          rule: "response-media-type-changed",
          description: `Response media type changed from ${change.oldMediaType} to ${change.newMediaType} on ${change.method.toUpperCase()} ${change.path} (${change.statusCode})`,
          path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
          category: "structural",
        });
        break;

      case "response-description-changed":
        safeChanges.push({
          id: uuid(),
          rule: "response-description-changed",
          description: `Response description changed for ${change.statusCode} on ${change.method.toUpperCase()} ${change.path}`,
          path: `${change.path}/${change.method.toUpperCase()}/responses/${change.statusCode}`,
          category: "documentation",
        });
        break;

      case "global-security-added":
        breakingChanges.push({
          id: uuid(),
          rule: "global-security-added",
          description: "Global security requirement was added",
          path: "/security",
          category: "structural",
        });
        break;

      case "global-security-removed":
        safeChanges.push({
          id: uuid(),
          rule: "global-security-removed",
          description: "Global security requirement was removed",
          path: "/security",
          category: "documentation",
        });
        break;

      case "documentation-updated":
        safeChanges.push({
          id: uuid(),
          rule: change.kind,
          description: `${change.kind.replace(/-/g, " ")}${change.detail ? ` (${change.detail})` : ""}`,
          path: change.method ? `${change.path}/${change.method.toUpperCase()}` : change.path,
          category: "documentation",
        });
        break;
    }
  }

  const hasStructuralSafe = safeChanges.some((c) => c.category === "structural");
  const classification: VersionClassification =
    breakingChanges.length > 0 ? "major"
    : hasStructuralSafe ? "minor"
    : safeChanges.length > 0 ? "patch"
    : "patch";

  return {
    compatReport: {
      previousVersion,
      classification,
      breakingChanges,
      safeChanges,
    },
    hasGraceViolations,
  };
}

function describeGraceViolation(
  path: string,
  method: string,
  violation: GraceViolation,
  paramName?: string,
  paramIn?: string,
  propertyPath?: string,
  statusCode?: string,
): string {
  const endpoint = `${method.toUpperCase()} ${path}`;

  if (paramName && paramIn) {
    switch (violation.rule) {
      case "param-removed-without-deprecation":
        return `${endpoint}: ${paramIn} parameter '${paramName}' was removed without first being marked as deprecated`;
      case "param-removed-missing-sunset":
        return `${endpoint}: ${paramIn} parameter '${paramName}' is deprecated but has no x-sunset date set`;
      case "param-removed-before-sunset":
        return `${endpoint}: ${paramIn} parameter '${paramName}' was removed before its sunset date (${violation.xSunset ?? "unknown"})`;
    }
  }

  if (propertyPath && statusCode) {
    switch (violation.rule) {
      case "response-property-removed-without-deprecation":
        return `${endpoint}: response property '${propertyPath}' was removed from ${statusCode} response without first being marked as deprecated`;
      case "response-property-removed-missing-sunset":
        return `${endpoint}: response property '${propertyPath}' in ${statusCode} response is deprecated but has no x-sunset date set`;
      case "response-property-removed-before-sunset":
        return `${endpoint}: response property '${propertyPath}' was removed from ${statusCode} response before its sunset date (${violation.xSunset ?? "unknown"})`;
    }
  }

  if (propertyPath) {
    switch (violation.rule) {
      case "request-body-property-removed-without-deprecation":
        return `${endpoint}: request body property '${propertyPath}' was removed without first being marked as deprecated`;
      case "request-body-property-removed-missing-sunset":
        return `${endpoint}: request body property '${propertyPath}' is deprecated but has no x-sunset date set`;
      case "request-body-property-removed-before-sunset":
        return `${endpoint}: request body property '${propertyPath}' was removed before its sunset date (${violation.xSunset ?? "unknown"})`;
    }
  }

  switch (violation.rule) {
    case "endpoint-removed-without-deprecation":
      return `${endpoint} was removed without first being marked as deprecated`;
    case "endpoint-removed-missing-sunset":
      return `${endpoint} is deprecated but has no x-sunset date set`;
    case "endpoint-removed-before-sunset":
      return `${endpoint} was removed before its sunset date (${violation.xSunset ?? "unknown"})`;
    default:
      return `${endpoint} grace period violation: ${violation.rule}`;
  }
}
