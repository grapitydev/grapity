import type { Endpoint, EndpointGroup, EndpointParam, SchemaProperty, RequestBody, ResponseInfo } from "../context/SpecExplorerContext";

function extractGroupName(path: string): string {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "general";
  const firstMeaningful = parts.find((p) => !p.startsWith("{") && !/^v\d/.test(p));
  return firstMeaningful ?? parts[parts.length - 1] ?? "general";
}

function kebabToTitle(str: string): string {
  return str
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function resolveRef(spec: Record<string, unknown>, ref: string): unknown {
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
}

function refNameFromPath(ref: string): string {
  const parts = ref.split("/");
  return parts[parts.length - 1] || "object";
}

function formatEnumValues(enumValues: unknown[]): string {
  const values = enumValues
    .filter((v): v is string => typeof v === "string")
    .join(", ");
  return values ? ` (${values})` : "";
}

function getSchemaDisplayType(spec: Record<string, unknown>, schema: unknown): string {
  if (!schema || typeof schema !== "object") return "unknown";
  const s = schema as Record<string, unknown>;
  if (s.$ref) {
    return getRefDisplayType(spec, String(s.$ref));
  }
  const type = String(s.type || "");
  const enumValues = Array.isArray(s.enum) ? s.enum : [];

  if (type && type !== "object" && type !== "array") {
    return type + formatEnumValues(enumValues);
  }

  if (type === "array" && s.items) {
    return `array<${getSchemaDisplayType(spec, s.items)}>`;
  }

  if (Array.isArray(s.allOf) && s.allOf.length > 0) {
    const first = s.allOf[0];
    if (first && typeof first === "object") {
      const f = first as Record<string, unknown>;
      if (f.$ref) {
        return getRefDisplayType(spec, String(f.$ref));
      }
    }
  }

  const title = String(s.title || "");
  if (title) return title;

  return type || "object";
}

function getRefDisplayType(spec: Record<string, unknown>, ref: string): string {
  const resolved = resolveRef(spec, ref);
  if (!resolved || typeof resolved !== "object") return "unknown";
  const r = resolved as Record<string, unknown>;
  const type = String(r.type || "");
  const enumValues = Array.isArray(r.enum) ? r.enum : [];

  if (type && type !== "object" && type !== "array") {
    return type + formatEnumValues(enumValues);
  }

  if (type === "array" && r.items) {
    const items = r.items as Record<string, unknown>;
    if (items.$ref) {
      return `array<${getRefDisplayType(spec, String(items.$ref))}>`;
    }
    return `array<${getSchemaDisplayType(spec, items)}>`;
  }

  const title = String(r.title || "");
  if (title) return title;

  return refNameFromPath(ref);
}

function extractSchemaProperties(
  spec: Record<string, unknown>,
  schema: unknown,
  depth: number = 0,
): SchemaProperty[] {
  if (depth > 10) return [];
  if (!schema || typeof schema !== "object") return [];

  const s = schema as Record<string, unknown>;

  if (s.$ref) {
    const resolved = resolveRef(spec, String(s.$ref));
    if (resolved) return extractSchemaProperties(spec, resolved, depth);
    return [];
  }

  // Handle allOf by merging properties from all sub-schemas
  if (Array.isArray(s.allOf)) {
    const mergedProperties: SchemaProperty[] = [];
    const seenNames = new Set<string>();
    for (const subSchema of s.allOf) {
      const subProps = extractSchemaProperties(spec, subSchema, depth + 1);
      for (const prop of subProps) {
        if (!seenNames.has(prop.name)) {
          seenNames.add(prop.name);
          mergedProperties.push(prop);
        }
      }
    }

    // Also merge inline properties defined alongside allOf
    const inlineRequired = new Set((s.required as string[]) || []);
    for (const [name, prop] of Object.entries(s.properties || {})) {
      if (!prop || typeof prop !== "object") continue;
      if (seenNames.has(name)) continue;
      seenNames.add(name);
      const p = prop as Record<string, unknown>;
      const isDeprecated = Boolean(p.deprecated);
      const xSunset = p["x-sunset"] ? String(p["x-sunset"]) : undefined;
      if (p.$ref) {
        const resolved = resolveRef(spec, String(p.$ref));
        if (resolved) {
          const resolvedObj = resolved as Record<string, unknown>;
          const resolvedType = String(resolvedObj.type || "");
          mergedProperties.push({
            name,
            type: getRefDisplayType(spec, String(p.$ref)),
            required: inlineRequired.has(name),
            description: resolvedObj.description ? String(resolvedObj.description) : undefined,
            properties:
              resolvedType === "object" || resolvedType === "array" || !resolvedType
                ? extractSchemaProperties(spec, resolved, depth + 1)
                : undefined,
            deprecated: isDeprecated,
            xSunset,
          });
          continue;
        }
      }

      let type = String(p.type || "unknown");
      if (type === "array" && p.items) {
        const items = p.items as Record<string, unknown>;
        if (items.$ref) {
          const resolved = resolveRef(spec, String(items.$ref));
          if (resolved) {
            type = `array<${getRefDisplayType(spec, String(items.$ref))}>`;
            mergedProperties.push({
              name,
              type,
              required: inlineRequired.has(name),
              description: p.description ? String(p.description) : undefined,
              properties: extractSchemaProperties(spec, resolved, depth + 1),
              deprecated: isDeprecated,
              xSunset,
            });
            continue;
          }
          type = `array<${getSchemaDisplayType(spec, items)}>`;
        } else {
          type = `array<${getSchemaDisplayType(spec, items)}>`;
        }
      }

      if ((type === "object" || p.properties) && p.properties) {
        mergedProperties.push({
          name,
          type,
          required: inlineRequired.has(name),
          description: p.description ? String(p.description) : undefined,
          format: p.format ? String(p.format) : undefined,
          properties: extractSchemaProperties(spec, p, depth + 1),
          deprecated: isDeprecated,
          xSunset,
        });
        continue;
      }

      mergedProperties.push({
        name,
        type,
        required: inlineRequired.has(name),
        description: p.description ? String(p.description) : undefined,
        format: p.format ? String(p.format) : undefined,
        deprecated: isDeprecated,
        xSunset,
      });
    }

    return mergedProperties;
  }

  const required = new Set((s.required as string[]) || []);
  const properties: SchemaProperty[] = [];

  for (const [name, prop] of Object.entries(s.properties || {})) {
    if (!prop || typeof prop !== "object") continue;
    const p = prop as Record<string, unknown>;

    const isDeprecated = Boolean(p.deprecated);
    const xSunset = p["x-sunset"] ? String(p["x-sunset"]) : undefined;

    if (p.$ref) {
      const resolved = resolveRef(spec, String(p.$ref));
      if (resolved) {
        const resolvedObj = resolved as Record<string, unknown>;
        const resolvedType = String(resolvedObj.type || "");
        properties.push({
          name,
          type: getRefDisplayType(spec, String(p.$ref)),
          required: required.has(name),
          description: resolvedObj.description ? String(resolvedObj.description) : undefined,
          properties:
            resolvedType === "object" || resolvedType === "array" || !resolvedType
              ? extractSchemaProperties(spec, resolved, depth + 1)
              : undefined,
          deprecated: isDeprecated,
          xSunset,
        });
        continue;
      }
    }

    // allOf with a leading $ref should borrow the type name from the ref
    if (Array.isArray(p.allOf) && p.allOf.length > 0) {
      const first = p.allOf[0];
      if (first && typeof first === "object") {
        const f = first as Record<string, unknown>;
        if (f.$ref) {
          const resolved = resolveRef(spec, String(f.$ref));
          if (resolved) {
            const resolvedObj = resolved as Record<string, unknown>;
            properties.push({
              name,
              type: getRefDisplayType(spec, String(f.$ref)),
              required: required.has(name),
              description: resolvedObj.description ? String(resolvedObj.description) : undefined,
              properties: extractSchemaProperties(spec, p, depth + 1),
              deprecated: isDeprecated,
              xSunset,
            });
            continue;
          }
        }
      }
    }

    let type = String(p.type || "unknown");

    if (type === "array" && p.items) {
      const items = p.items as Record<string, unknown>;
      if (items.$ref) {
        const resolved = resolveRef(spec, String(items.$ref));
        if (resolved) {
          type = `array<${getRefDisplayType(spec, String(items.$ref))}>`;
          properties.push({
            name,
            type,
            required: required.has(name),
            description: p.description ? String(p.description) : undefined,
            properties: extractSchemaProperties(spec, resolved, depth + 1),
            deprecated: isDeprecated,
            xSunset,
          });
          continue;
        }
        type = `array<${getSchemaDisplayType(spec, items)}>`;
      } else {
        type = `array<${getSchemaDisplayType(spec, items)}>`;
      }
    }

    if ((type === "object" || p.properties) && p.properties) {
      properties.push({
        name,
        type,
        required: required.has(name),
        description: p.description ? String(p.description) : undefined,
        format: p.format ? String(p.format) : undefined,
        properties: extractSchemaProperties(spec, p, depth + 1),
        deprecated: isDeprecated,
        xSunset,
      });
      continue;
    }

    properties.push({
      name,
      type,
      required: required.has(name),
      description: p.description ? String(p.description) : undefined,
      format: p.format ? String(p.format) : undefined,
      deprecated: isDeprecated,
      xSunset,
    });
  }

  return properties;
}

function resolveParamSchemaType(spec: Record<string, unknown>, schema: unknown): string {
  if (!schema || typeof schema !== "object") return "unknown";
  const s = schema as Record<string, unknown>;
  if (s.$ref) {
    return getRefDisplayType(spec, String(s.$ref));
  }
  return String(s.type || "unknown");
}

function extractExample(content: Record<string, unknown> | undefined): string | undefined {
  if (!content) return undefined;
  const example = content.example;
  if (example !== undefined) {
    return JSON.stringify(example, null, 2);
  }
  const examples = content.examples as Record<string, unknown> | undefined;
  if (examples) {
    const first = Object.values(examples)[0];
    if (first && typeof first === "object") {
      const value = (first as Record<string, unknown>).value;
      if (value !== undefined) {
        return JSON.stringify(value, null, 2);
      }
    }
  }
  return undefined;
}

export function parseOpenAPI(json: string): EndpointGroup[] {
  try {
    const spec = JSON.parse(json);
    const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
    if (!paths || typeof paths !== "object") return [];

    const serverUrl = (spec.servers as { url?: string }[] | undefined)?.[0]?.url ?? "https://api.example.com";

    const endpoints: Endpoint[] = [];

    for (const [path, methods] of Object.entries(paths)) {
      if (!methods || typeof methods !== "object") continue;

      for (const [method, operation] of Object.entries(methods)) {
        if (typeof operation !== "object" || operation === null) continue;

        const op = operation as Record<string, unknown>;
        const group = extractGroupName(path);
        const id = `${group}-${method}-${path.replace(/[^a-zA-Z0-9]/g, "-")}`;

        const parameters: EndpointParam[] = [];
        const rawParams = op.parameters as unknown[] | undefined;
        if (Array.isArray(rawParams)) {
          for (const p of rawParams) {
            if (typeof p !== "object" || p === null) continue;
            const param = p as Record<string, unknown>;
            parameters.push({
              name: String(param.name ?? ""),
              type: resolveParamSchemaType(spec, param.schema),
              required: Boolean(param.required),
              in: String(param.in ?? "query"),
              description: param.description ? String(param.description) : undefined,
              deprecated: Boolean(param.deprecated),
              xSunset: param["x-sunset"] ? String(param["x-sunset"]) : undefined,
            });
          }
        }

        let requestBody: RequestBody | undefined;
        let exampleRequest: string | undefined;
        const rawReqBody = op.requestBody as Record<string, unknown> | undefined;
        if (rawReqBody) {
          const content = rawReqBody.content as Record<string, unknown> | undefined;
          const jsonContent = content?.["application/json"] as Record<string, unknown> | undefined;
          const schema = jsonContent?.schema;
          if (schema && typeof schema === "object") {
            requestBody = {
              required: Boolean(rawReqBody.required),
              properties: extractSchemaProperties(spec, schema),
            };
          }
          exampleRequest = extractExample(jsonContent);
        }

        const responses: ResponseInfo[] = [];
        const rawResponses = op.responses as Record<string, unknown> | undefined;
        if (rawResponses) {
          for (const [status, response] of Object.entries(rawResponses)) {
            if (!response || typeof response !== "object") continue;
            const resp = response as Record<string, unknown>;
            let responseProperties: SchemaProperty[] | undefined;
            let exampleBody: string | undefined;
            const content = resp.content as Record<string, unknown> | undefined;
            const jsonContent = content?.["application/json"] as Record<string, unknown> | undefined;
            const schema = jsonContent?.schema;
            if (schema && typeof schema === "object") {
              responseProperties = extractSchemaProperties(spec, schema);
            }
            exampleBody = extractExample(jsonContent);
            responses.push({
              status,
              description: String(resp.description || ""),
              properties: responseProperties,
              exampleBody,
            });
          }
        }

        endpoints.push({
          method: method.toUpperCase(),
          path,
          summary: String(op.summary ?? ""),
          description: op.description ? String(op.description) : undefined,
          parameters,
          requestBody,
          responses,
          serverUrl,
          exampleRequest,
          group,
          id,
          deprecated: Boolean(op.deprecated),
          xSunset: op["x-sunset"] ? String(op["x-sunset"]) : undefined,
        });
      }
    }

    const groups = new Map<string, Endpoint[]>();
    for (const ep of endpoints) {
      if (!groups.has(ep.group)) groups.set(ep.group, []);
      groups.get(ep.group)!.push(ep);
    }

    const result: EndpointGroup[] = [];
    for (const [name, eps] of groups) {
      result.push({ name: kebabToTitle(name), endpoints: eps });
    }

    result.sort((a, b) => a.name.localeCompare(b.name));
    for (const g of result) {
      g.endpoints.sort((a, b) => {
        if (a.deprecated && !b.deprecated) return 1;
        if (!a.deprecated && b.deprecated) return -1;
        return a.path.localeCompare(b.path) || a.method.localeCompare(b.method);
      });
    }

    return result;
  } catch {
    return [];
  }
}
