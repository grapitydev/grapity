import type { ParsedSpec } from "../parser/openapi/parse";

const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "head", "options", "trace"] as const;

export type RawChange =
  | { type: "endpoint-removed"; path: string; method: string; wasDeprecated: boolean; xSunset?: string; wasDraft?: boolean }
  | { type: "endpoint-added"; path: string; method: string }
  | { type: "endpoint-deprecated"; path: string; method: string; xSunset?: string }
  | { type: "endpoint-un-deprecated"; path: string; method: string }
  | { type: "stable-endpoint-marked-draft"; path: string; method: string }
  | { type: "draft-endpoint-marked-stable"; path: string; method: string }
  | { type: "required-param-added"; path: string; method: string; paramName: string; paramIn: string; wasDraft?: boolean }
  | { type: "optional-param-added"; path: string; method: string; paramName: string; paramIn: string }
  | { type: "param-removed"; path: string; method: string; paramName: string; paramIn: string; wasDeprecated: boolean; xSunset?: string; wasDraft?: boolean }
  | { type: "param-type-changed"; path: string; method: string; paramName: string; paramIn: string; oldType: string; newType: string; wasDraft?: boolean }
  | { type: "param-format-changed"; path: string; method: string; paramName: string; paramIn: string; oldFormat: string; newFormat: string }
  | { type: "param-now-required"; path: string; method: string; paramName: string; paramIn: string; wasDraft?: boolean }
  | { type: "param-now-optional"; path: string; method: string; paramName: string; paramIn: string }
  | { type: "param-description-changed"; path: string; method: string; paramName: string; paramIn: string }
  | { type: "param-default-changed"; path: string; method: string; paramName: string; paramIn: string }
  | { type: "param-deprecated"; path: string; method: string; paramName: string; paramIn: string; xSunset?: string }
  | { type: "param-un-deprecated"; path: string; method: string; paramName: string; paramIn: string }
  | { type: "param-enum-value-added"; path: string; method: string; paramName: string; paramIn: string; value: string }
  | { type: "param-enum-value-removed"; path: string; method: string; paramName: string; paramIn: string; value: string; wasDraft?: boolean }
  | { type: "request-body-added"; path: string; method: string }
  | { type: "request-body-removed"; path: string; method: string; wasDraft?: boolean }
  | { type: "request-body-property-added"; path: string; method: string; propertyPath: string; required: boolean; wasDraft?: boolean }
  | { type: "request-body-property-removed"; path: string; method: string; propertyPath: string; wasDeprecated: boolean; xSunset?: string; wasDraft?: boolean }
  | { type: "request-body-property-type-changed"; path: string; method: string; propertyPath: string; oldType: string; newType: string; wasDraft?: boolean }
  | { type: "request-body-property-now-required"; path: string; method: string; propertyPath: string; wasDraft?: boolean }
  | { type: "request-body-property-now-optional"; path: string; method: string; propertyPath: string }
  | { type: "request-body-property-deprecated"; path: string; method: string; propertyPath: string; xSunset?: string }
  | { type: "request-body-property-un-deprecated"; path: string; method: string; propertyPath: string }
  | { type: "request-body-media-type-changed"; path: string; method: string; oldMediaType: string; newMediaType: string }
  | { type: "request-body-description-changed"; path: string; method: string }
  | { type: "response-property-removed"; path: string; method: string; statusCode: string; propertyPath: string; originalValue?: string; wasDeprecated: boolean; xSunset?: string; wasDraft?: boolean }
  | { type: "response-property-added"; path: string; method: string; statusCode: string; propertyPath: string }
  | { type: "response-property-type-changed"; path: string; method: string; statusCode: string; propertyPath: string; oldType: string; newType: string; wasDraft?: boolean }
  | { type: "response-property-now-required"; path: string; method: string; statusCode: string; propertyPath: string; wasDraft?: boolean }
  | { type: "response-property-now-optional"; path: string; method: string; statusCode: string; propertyPath: string }
  | { type: "response-property-deprecated"; path: string; method: string; statusCode: string; propertyPath: string; xSunset?: string }
  | { type: "response-property-un-deprecated"; path: string; method: string; statusCode: string; propertyPath: string }
  | { type: "response-status-removed"; path: string; method: string; statusCode: string; wasDraft?: boolean }
  | { type: "response-status-added"; path: string; method: string; statusCode: string }
  | { type: "response-media-type-changed"; path: string; method: string; statusCode: string; oldMediaType: string; newMediaType: string }
  | { type: "response-description-changed"; path: string; method: string; statusCode: string }
  | { type: "global-security-added" }
  | { type: "global-security-removed" }
  | { type: "documentation-updated"; kind: string; path: string; method?: string; detail?: string };

interface FlattenedProperty {
  schema: any;
  required: boolean;
}

type RefResolver = (ref: string) => unknown;

function createRefResolver(spec: ParsedSpec): RefResolver {
  return (ref: string) => {
    if (!ref.startsWith("#/")) return undefined;
    const path = ref.replace("#/", "").split("/");
    let current: unknown = spec;
    for (const key of path) {
      if (current && typeof current === "object") {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return current;
  };
}

function resolveSchemaRef(resolver: RefResolver, schema: any): any {
  if (!schema || typeof schema !== "object") return schema;
  if (schema.$ref) {
    const resolved = resolver(schema.$ref);
    if (resolved && typeof resolved === "object") {
      return resolved;
    }
  }
  return schema;
}

function resolveParamRef(resolver: RefResolver, param: any): any {
  if (!param || typeof param !== "object") return param;
  if (param.$ref) {
    const resolved = resolver(param.$ref);
    if (resolved && typeof resolved === "object") {
      return resolved;
    }
  }
  return param;
}

export function diffSpecs(oldSpec: ParsedSpec, newSpec: ParsedSpec): RawChange[] {
  const changes: RawChange[] = [];
  const oldResolver = createRefResolver(oldSpec);
  const newResolver = createRefResolver(newSpec);

  changes.push(...diffGlobalMetadata(oldSpec, newSpec));

  const oldPaths: Record<string, any> = oldSpec.paths ?? {};
  const newPaths: Record<string, any> = newSpec.paths ?? {};

  for (const path of Object.keys(oldPaths)) {
    const oldPathItem: Record<string, any> = oldPaths[path] ?? {};
    const newPathItem: Record<string, any> = newPaths[path] ?? {};

    for (const method of HTTP_METHODS) {
      const oldOp = oldPathItem[method];
      const newOp = newPathItem[method];

      if (oldOp && !newOp) {
        changes.push({
          type: "endpoint-removed",
          path,
          method,
          wasDeprecated: !!oldOp.deprecated,
          xSunset: typeof oldOp["x-sunset"] === "string" ? oldOp["x-sunset"] : undefined,
          wasDraft: !!oldOp["x-draft"],
        });
      } else if (oldOp && newOp) {
        if (!oldOp["x-draft"] && newOp["x-draft"]) {
          changes.push({ type: "stable-endpoint-marked-draft", path, method });
        }
        if (oldOp["x-draft"] && !newOp["x-draft"]) {
          changes.push({ type: "draft-endpoint-marked-stable", path, method });
        }
        if (!oldOp.deprecated && newOp.deprecated) {
          changes.push({
            type: "endpoint-deprecated",
            path,
            method,
            xSunset: typeof newOp["x-sunset"] === "string" ? newOp["x-sunset"] : undefined,
          });
        }
        if (oldOp.deprecated && !newOp.deprecated) {
          changes.push({ type: "endpoint-un-deprecated", path, method });
        }
        changes.push(...diffOperationMetadata(path, method, oldOp, newOp));
        changes.push(...diffParameters(path, method, oldOp, newOp, oldResolver, newResolver));
        changes.push(...diffRequestBody(path, method, oldOp, newOp, oldResolver, newResolver));
        changes.push(...diffResponses(path, method, oldOp, newOp, oldResolver, newResolver));
      }
    }
  }

  for (const path of Object.keys(newPaths)) {
    const oldPathItem: Record<string, any> = oldPaths[path] ?? {};
    const newPathItem: Record<string, any> = newPaths[path] ?? {};

    for (const method of HTTP_METHODS) {
      if (!oldPathItem[method] && newPathItem[method]) {
        changes.push({ type: "endpoint-added", path, method });
      }
    }
  }

  return changes;
}

function diffGlobalMetadata(oldSpec: ParsedSpec, newSpec: ParsedSpec): RawChange[] {
  const changes: RawChange[] = [];

  const oldInfo = oldSpec.info ?? {};
  const newInfo = newSpec.info ?? {};

  if (oldInfo.title !== newInfo.title && (oldInfo.title !== undefined || newInfo.title !== undefined)) {
    changes.push({ type: "documentation-updated", kind: "info-title-changed", path: "/info/title", detail: `${oldInfo.title} → ${newInfo.title}` });
  }
  if (oldInfo.version !== newInfo.version && (oldInfo.version !== undefined || newInfo.version !== undefined)) {
    changes.push({ type: "documentation-updated", kind: "info-version-changed", path: "/info/version", detail: `${oldInfo.version} → ${newInfo.version}` });
  }
  if (oldInfo.description !== newInfo.description && (oldInfo.description !== undefined || newInfo.description !== undefined)) {
    changes.push({ type: "documentation-updated", kind: "info-description-changed", path: "/info/description" });
  }

  const oldServers = (oldSpec.servers ?? []).map((s: any) => (typeof s === "string" ? s : s?.url)).filter(Boolean);
  const newServers = (newSpec.servers ?? []).map((s: any) => (typeof s === "string" ? s : s?.url)).filter(Boolean);
  if (!arraysEqual(oldServers, newServers)) {
    changes.push({ type: "documentation-updated", kind: "servers-changed", path: "/servers" });
  }

  const oldSecurity = oldSpec.security ?? [];
  const newSecurity = newSpec.security ?? [];
  if (oldSecurity.length === 0 && newSecurity.length > 0) {
    changes.push({ type: "global-security-added" });
  } else if (oldSecurity.length > 0 && newSecurity.length === 0) {
    changes.push({ type: "global-security-removed" });
  } else if (!deepEqual(oldSecurity, newSecurity)) {
    changes.push({ type: "documentation-updated", kind: "security-scheme-changed", path: "/security" });
  }

  const oldWebhooks = Object.keys(oldSpec.webhooks ?? {});
  const newWebhooks = Object.keys(newSpec.webhooks ?? {});
  const addedWebhooks = newWebhooks.filter((w) => !oldWebhooks.includes(w));
  const removedWebhooks = oldWebhooks.filter((w) => !newWebhooks.includes(w));
  for (const w of addedWebhooks) {
    changes.push({ type: "documentation-updated", kind: "webhook-added", path: `/webhooks/${w}` });
  }
  for (const w of removedWebhooks) {
    changes.push({ type: "documentation-updated", kind: "webhook-removed", path: `/webhooks/${w}` });
  }

  if (!deepEqual(oldSpec.externalDocs, newSpec.externalDocs)) {
    changes.push({ type: "documentation-updated", kind: "external-docs-changed", path: "/externalDocs" });
  }

  return changes;
}

function diffOperationMetadata(path: string, method: string, oldOp: any, newOp: any): RawChange[] {
  const changes: RawChange[] = [];

  if (oldOp.operationId !== newOp.operationId && (oldOp.operationId !== undefined || newOp.operationId !== undefined)) {
    changes.push({ type: "documentation-updated", kind: "operation-id-changed", path, method });
  }
  if (oldOp.summary !== newOp.summary && (oldOp.summary !== undefined || newOp.summary !== undefined)) {
    changes.push({ type: "documentation-updated", kind: "summary-changed", path, method });
  }
  if (oldOp.description !== newOp.description && (oldOp.description !== undefined || newOp.description !== undefined)) {
    changes.push({ type: "documentation-updated", kind: "description-changed", path, method });
  }
  if (!arraysEqual(oldOp.tags ?? [], newOp.tags ?? [])) {
    changes.push({ type: "documentation-updated", kind: "tags-changed", path, method });
  }

  return changes;
}

function diffParameters(
  path: string,
  method: string,
  oldOp: any,
  newOp: any,
  oldResolver: RefResolver,
  newResolver: RefResolver,
): RawChange[] {
  const changes: RawChange[] = [];
  const wasDraft = !!oldOp["x-draft"];

  const oldParamMap = new Map<string, any>();
  for (const p of (oldOp.parameters ?? [])) {
    const resolved = resolveParamRef(oldResolver, p);
    if (resolved) {
      oldParamMap.set(`${resolved.name}:${resolved.in}`, resolved);
    }
  }

  const newParamMap = new Map<string, any>();
  for (const p of (newOp.parameters ?? [])) {
    const resolved = resolveParamRef(newResolver, p);
    if (resolved) {
      newParamMap.set(`${resolved.name}:${resolved.in}`, resolved);
    }
  }

  for (const [key, newParam] of newParamMap) {
    if (!oldParamMap.has(key)) {
      if (newParam.required) {
        changes.push({ type: "required-param-added", path, method, paramName: newParam.name, paramIn: newParam.in, wasDraft });
      } else {
        changes.push({ type: "optional-param-added", path, method, paramName: newParam.name, paramIn: newParam.in });
      }
    }
  }

  for (const [key, oldParam] of oldParamMap) {
    const newParam = newParamMap.get(key);
    if (!newParam) {
      changes.push({
        type: "param-removed",
        path,
        method,
        paramName: oldParam.name,
        paramIn: oldParam.in,
        wasDeprecated: !!oldParam.deprecated,
        xSunset: typeof oldParam["x-sunset"] === "string" ? oldParam["x-sunset"] : undefined,
        wasDraft,
      });
      continue;
    }

    const oldType = oldParam.schema?.type ?? oldParam.type ?? "any";
    const newType = newParam.schema?.type ?? newParam.type ?? "any";
    if (oldType !== newType) {
      changes.push({ type: "param-type-changed", path, method, paramName: oldParam.name, paramIn: oldParam.in, oldType, newType, wasDraft });
    }

    const oldFormat = oldParam.schema?.format ?? oldParam.format ?? "";
    const newFormat = newParam.schema?.format ?? newParam.format ?? "";
    if (oldFormat !== newFormat) {
      changes.push({ type: "param-format-changed", path, method, paramName: oldParam.name, paramIn: oldParam.in, oldFormat, newFormat });
    }

    if (!oldParam.required && newParam.required) {
      changes.push({ type: "param-now-required", path, method, paramName: oldParam.name, paramIn: oldParam.in, wasDraft });
    }
    if (oldParam.required && !newParam.required) {
      changes.push({ type: "param-now-optional", path, method, paramName: oldParam.name, paramIn: oldParam.in });
    }

    if (oldParam.description !== newParam.description && (oldParam.description !== undefined || newParam.description !== undefined)) {
      changes.push({ type: "param-description-changed", path, method, paramName: oldParam.name, paramIn: oldParam.in });
    }

    if (!deepEqual(oldParam.default, newParam.default)) {
      changes.push({ type: "param-default-changed", path, method, paramName: oldParam.name, paramIn: oldParam.in });
    }

    if (!oldParam.deprecated && newParam.deprecated) {
      changes.push({
        type: "param-deprecated",
        path,
        method,
        paramName: oldParam.name,
        paramIn: oldParam.in,
        xSunset: typeof newParam["x-sunset"] === "string" ? newParam["x-sunset"] : undefined,
      });
    }
    if (oldParam.deprecated && !newParam.deprecated) {
      changes.push({ type: "param-un-deprecated", path, method, paramName: oldParam.name, paramIn: oldParam.in });
    }

    const oldEnum = new Set(Array.isArray(oldParam.schema?.enum) ? oldParam.schema.enum : []);
    const newEnum = new Set(Array.isArray(newParam.schema?.enum) ? newParam.schema.enum : []);
    for (const v of newEnum) {
      if (!oldEnum.has(v)) {
        changes.push({ type: "param-enum-value-added", path, method, paramName: oldParam.name, paramIn: oldParam.in, value: String(v) });
      }
    }
    for (const v of oldEnum) {
      if (!newEnum.has(v)) {
        changes.push({ type: "param-enum-value-removed", path, method, paramName: oldParam.name, paramIn: oldParam.in, value: String(v), wasDraft });
      }
    }
  }

  return changes;
}

function diffRequestBody(
  path: string,
  method: string,
  oldOp: any,
  newOp: any,
  oldResolver: RefResolver,
  newResolver: RefResolver,
): RawChange[] {
  const changes: RawChange[] = [];
  const wasDraft = !!oldOp["x-draft"];

  const oldBody = oldOp.requestBody;
  const newBody = newOp.requestBody;

  if (!oldBody && newBody) {
    changes.push({ type: "request-body-added", path, method });
    return changes;
  }
  if (oldBody && !newBody) {
    changes.push({ type: "request-body-removed", path, method, wasDraft });
    return changes;
  }
  if (!oldBody && !newBody) {
    return changes;
  }

  const oldMediaTypes = Object.keys(oldBody.content ?? {});
  const newMediaTypes = Object.keys(newBody.content ?? {});
  const sharedMediaTypes = oldMediaTypes.filter((m) => newMediaTypes.includes(m));

  if (oldMediaTypes.length > 0 && newMediaTypes.length > 0 && sharedMediaTypes.length === 0) {
    changes.push({
      type: "request-body-media-type-changed",
      path,
      method,
      oldMediaType: oldMediaTypes[0],
      newMediaType: newMediaTypes[0],
    });
  }

  if (oldBody.description !== newBody.description && (oldBody.description !== undefined || newBody.description !== undefined)) {
    changes.push({ type: "request-body-description-changed", path, method });
  }

  for (const mediaType of sharedMediaTypes) {
    const oldSchema = oldBody.content[mediaType]?.schema;
    const newSchema = newBody.content[mediaType]?.schema;
    if (oldSchema && newSchema) {
      changes.push(...diffSchemaProperties(path, method, oldSchema, newSchema, "request-body", wasDraft, oldResolver, newResolver));
    }
  }

  return changes;
}

function diffResponses(
  path: string,
  method: string,
  oldOp: any,
  newOp: any,
  oldResolver: RefResolver,
  newResolver: RefResolver,
): RawChange[] {
  const changes: RawChange[] = [];
  const wasDraft = !!oldOp["x-draft"];

  const oldResponses: Record<string, any> = oldOp.responses ?? {};
  const newResponses: Record<string, any> = newOp.responses ?? {};

  for (const status of Object.keys(oldResponses)) {
    if (!newResponses[status]) {
      changes.push({ type: "response-status-removed", path, method, statusCode: status, wasDraft });
    } else {
      changes.push(...diffResponse(path, method, status, oldResponses[status], newResponses[status], wasDraft, oldResolver, newResolver));
    }
  }

  for (const status of Object.keys(newResponses)) {
    if (!oldResponses[status]) {
      changes.push({ type: "response-status-added", path, method, statusCode: status });
    }
  }

  return changes;
}

function diffResponse(
  path: string,
  method: string,
  statusCode: string,
  oldResp: any,
  newResp: any,
  wasDraft: boolean,
  oldResolver: RefResolver,
  newResolver: RefResolver,
): RawChange[] {
  const changes: RawChange[] = [];

  if (oldResp.description !== newResp.description && (oldResp.description !== undefined || newResp.description !== undefined)) {
    changes.push({ type: "response-description-changed", path, method, statusCode });
  }

  const oldMediaTypes = Object.keys(oldResp.content ?? {});
  const newMediaTypes = Object.keys(newResp.content ?? {});
  const sharedMediaTypes = oldMediaTypes.filter((m) => newMediaTypes.includes(m));

  if (oldMediaTypes.length > 0 && newMediaTypes.length > 0 && sharedMediaTypes.length === 0) {
    changes.push({
      type: "response-media-type-changed",
      path,
      method,
      statusCode,
      oldMediaType: oldMediaTypes[0],
      newMediaType: newMediaTypes[0],
    });
  }

  for (const mediaType of sharedMediaTypes) {
    const oldSchema = oldResp.content[mediaType]?.schema;
    const newSchema = newResp.content[mediaType]?.schema;
    if (oldSchema && newSchema) {
      changes.push(...diffSchemaProperties(path, method, oldSchema, newSchema, `response/${statusCode}`, wasDraft, oldResolver, newResolver));
    }
  }

  return changes;
}

function diffSchemaProperties(
  path: string,
  method: string,
  oldSchema: any,
  newSchema: any,
  prefix: string,
  wasDraft: boolean,
  oldResolver: RefResolver,
  newResolver: RefResolver,
): RawChange[] {
  const changes: RawChange[] = [];

  const oldProps = flattenSchemaProperties(oldSchema, oldResolver);
  const newProps = flattenSchemaProperties(newSchema, newResolver);

  for (const [propPath, newProp] of newProps) {
    const fullPath = prefix ? `${prefix}.${propPath}` : propPath;
    if (!oldProps.has(propPath)) {
      if (prefix.startsWith("request-body")) {
        changes.push({
          type: "request-body-property-added",
          path,
          method,
          propertyPath: propPath,
          required: newProp.required,
          wasDraft,
        });
      } else if (prefix.startsWith("response/")) {
        const statusCode = prefix.split("/")[1];
        changes.push({
          type: "response-property-added",
          path,
          method,
          statusCode,
          propertyPath: propPath,
        });
      }
    }
  }

  for (const [propPath, oldProp] of oldProps) {
    const fullPath = prefix ? `${prefix}.${propPath}` : propPath;
    const newProp = newProps.get(propPath);
    if (!newProp) {
      const wasDeprecated = !!oldProp.schema?.deprecated;
      const xSunset = typeof oldProp.schema?.["x-sunset"] === "string" ? oldProp.schema["x-sunset"] : undefined;
      if (prefix.startsWith("request-body")) {
        changes.push({
          type: "request-body-property-removed",
          path,
          method,
          propertyPath: propPath,
          wasDeprecated,
          xSunset,
          wasDraft,
        });
      } else if (prefix.startsWith("response/")) {
        const statusCode = prefix.split("/")[1];
        changes.push({
          type: "response-property-removed",
          path,
          method,
          statusCode,
          propertyPath: propPath,
          originalValue: safeStringify(oldProp.schema),
          wasDeprecated,
          xSunset,
          wasDraft,
        });
      }
      continue;
    }

    if (!oldProp.schema?.deprecated && newProp.schema?.deprecated) {
      const xSunset = typeof newProp.schema?.["x-sunset"] === "string" ? newProp.schema["x-sunset"] : undefined;
      if (prefix.startsWith("request-body")) {
        changes.push({
          type: "request-body-property-deprecated",
          path,
          method,
          propertyPath: propPath,
          xSunset,
        });
      } else if (prefix.startsWith("response/")) {
        const statusCode = prefix.split("/")[1];
        changes.push({
          type: "response-property-deprecated",
          path,
          method,
          statusCode,
          propertyPath: propPath,
          xSunset,
        });
      }
    }

    if (oldProp.schema?.deprecated && !newProp.schema?.deprecated) {
      if (prefix.startsWith("request-body")) {
        changes.push({
          type: "request-body-property-un-deprecated",
          path,
          method,
          propertyPath: propPath,
        });
      } else if (prefix.startsWith("response/")) {
        const statusCode = prefix.split("/")[1];
        changes.push({
          type: "response-property-un-deprecated",
          path,
          method,
          statusCode,
          propertyPath: propPath,
        });
      }
    }

    const oldType = oldProp.schema?.type ?? "any";
    const newType = newProp.schema?.type ?? "any";
    if (oldType !== newType) {
      if (prefix.startsWith("request-body")) {
        changes.push({
          type: "request-body-property-type-changed",
          path,
          method,
          propertyPath: propPath,
          oldType,
          newType,
          wasDraft,
        });
      } else if (prefix.startsWith("response/")) {
        const statusCode = prefix.split("/")[1];
        changes.push({
          type: "response-property-type-changed",
          path,
          method,
          statusCode,
          propertyPath: propPath,
          oldType,
          newType,
          wasDraft,
        });
      }
    }

    if (!oldProp.required && newProp.required) {
      if (prefix.startsWith("request-body")) {
        changes.push({
          type: "request-body-property-now-required",
          path,
          method,
          propertyPath: propPath,
          wasDraft,
        });
      } else if (prefix.startsWith("response/")) {
        const statusCode = prefix.split("/")[1];
        changes.push({
          type: "response-property-now-required",
          path,
          method,
          statusCode,
          propertyPath: propPath,
          wasDraft,
        });
      }
    }

    if (oldProp.required && !newProp.required) {
      if (prefix.startsWith("request-body")) {
        changes.push({
          type: "request-body-property-now-optional",
          path,
          method,
          propertyPath: propPath,
        });
      } else if (prefix.startsWith("response/")) {
        const statusCode = prefix.split("/")[1];
        changes.push({
          type: "response-property-now-optional",
          path,
          method,
          statusCode,
          propertyPath: propPath,
        });
      }
    }
  }

  return changes;
}

function flattenSchemaProperties(schema: any, resolver: RefResolver, prefix = "", parentRequired = false): Map<string, FlattenedProperty> {
  const result = new Map<string, FlattenedProperty>();
  if (!schema || typeof schema !== "object") return result;

  // Resolve $ref before processing
  const resolved = resolveSchemaRef(resolver, schema);
  if (!resolved || typeof resolved !== "object") return result;

  const requiredSet = new Set(Array.isArray(resolved.required) ? resolved.required : []);

  if (resolved.properties) {
    for (const [key, value] of Object.entries<any>(resolved.properties)) {
      const propPath = prefix ? `${prefix}.${key}` : key;
      const isRequired = requiredSet.has(key);
      result.set(propPath, { schema: value, required: isRequired });
      if (value?.properties || value?.allOf || value?.anyOf || value?.oneOf || value?.$ref || (value?.additionalProperties && typeof value.additionalProperties === "object")) {
        for (const [subKey, subVal] of flattenSchemaProperties(value, resolver, propPath, isRequired)) {
          result.set(subKey, subVal);
        }
      }
    }
  }

  // Handle additionalProperties with a schema shape
  if (resolved.additionalProperties && typeof resolved.additionalProperties === "object") {
    const ap = resolved.additionalProperties;
    if (ap.type || ap.properties || ap.allOf || ap.anyOf || ap.oneOf || ap.$ref) {
      for (const [subKey, subVal] of flattenSchemaProperties(ap, resolver, prefix, parentRequired)) {
        if (!result.has(subKey)) {
          result.set(subKey, subVal);
        }
      }
    }
  }

  const composed = resolved.allOf ?? resolved.anyOf ?? resolved.oneOf;
  if (composed) {
    for (const sub of composed) {
      for (const [subKey, subVal] of flattenSchemaProperties(sub, resolver, prefix, parentRequired)) {
        if (!result.has(subKey)) {
          result.set(subKey, subVal);
        }
      }
    }
  }

  return result;
}

function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!deepEqual(a[i], b[i])) return false;
  }
  return true;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function safeStringify(value: any): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
