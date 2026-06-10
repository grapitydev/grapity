import yaml from "js-yaml";

const HTTP_METHODS = ["get", "post", "put", "delete", "patch", "head", "options", "trace"];

const ROOT_ORDER = ["openapi", "info", "servers", "tags", "paths", "webhooks", "components", "security", "externalDocs"];

const OPERATION_ORDER = ["tags", "summary", "description", "operationId", "parameters", "requestBody", "responses", "security", "deprecated"];

const COMPONENTS_ORDER = ["schemas", "responses", "parameters", "requestBodies", "headers", "securitySchemes", "links", "callbacks"];

export function normalizeSpec(content: string): string {
  const trimmed = content.trimStart();
  const isJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  const parsed = yaml.load(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid spec content: not a valid YAML/JSON object");
  }

  const canonical = sortObjectKeys(parsed, []) as Record<string, unknown>;

  if (isJson) {
    return JSON.stringify(canonical, null, 2) + "\n";
  }

  return yaml.dump(canonical, {
    noRefs: true,
    lineWidth: -1,
  });
}

function sortObjectKeys(value: unknown, path: string[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeys(item, path));
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    const sortedKeys = getSortedKeys(keys, path);

    const sorted: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      sorted[key] = sortObjectKeys(obj[key], [...path, key]);
    }
    return sorted;
  }

  return value;
}

function getSortedKeys(keys: string[], path: string[]): string[] {
  if (path.length === 0) {
    return sortKeysByOrder(keys, ROOT_ORDER);
  }

  if (path.length === 2 && (path[0] === "paths" || path[0] === "webhooks")) {
    return sortPathItemKeys(keys);
  }

  if (path.length === 3 && (path[0] === "paths" || path[0] === "webhooks") && HTTP_METHODS.includes(path[2])) {
    return sortKeysByOrder(keys, OPERATION_ORDER);
  }

  if (path.length === 1 && path[0] === "components") {
    return sortKeysByOrder(keys, COMPONENTS_ORDER);
  }

  return keys.sort();
}

function sortKeysByOrder(keys: string[], order: string[]): string[] {
  const known = new Set(order);
  const knownKeys: string[] = [];
  const unknownKeys: string[] = [];

  for (const key of keys) {
    if (known.has(key)) {
      knownKeys.push(key);
    } else {
      unknownKeys.push(key);
    }
  }

  knownKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  unknownKeys.sort();

  return [...knownKeys, ...unknownKeys];
}

function sortPathItemKeys(keys: string[]): string[] {
  const methodSet = new Set(HTTP_METHODS);
  const methods: string[] = [];
  const others: string[] = [];

  for (const key of keys) {
    if (methodSet.has(key)) {
      methods.push(key);
    } else {
      others.push(key);
    }
  }

  methods.sort((a, b) => HTTP_METHODS.indexOf(a) - HTTP_METHODS.indexOf(b));
  others.sort();

  return [...methods, ...others];
}
