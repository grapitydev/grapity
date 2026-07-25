import yaml from "js-yaml";

/**
 * Rewrites `info.version` inside a spec document to the registry-assigned
 * semver. The registry is the sole authority on versioning, so the pushed
 * value is discarded. Returns the content unchanged when it does not parse
 * to a YAML/JSON object.
 */
export function stampInfoVersion(content: string, semver: string): string {
  const trimmed = content.trimStart();
  const isJson = trimmed.startsWith("{") || trimmed.startsWith("[");

  const parsed = yaml.load(content);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return content;
  }

  const doc = parsed as Record<string, unknown>;
  const info = (doc.info && typeof doc.info === "object" && !Array.isArray(doc.info)
    ? doc.info
    : {}) as Record<string, unknown>;
  info.version = semver;
  doc.info = info;

  if (isJson) {
    return JSON.stringify(doc, null, 2) + "\n";
  }

  return yaml.dump(doc, { noRefs: true, lineWidth: -1 });
}
