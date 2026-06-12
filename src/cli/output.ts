import chalk from "chalk";
import type {
  PushSpecResponse,
  ValidateSpecResponse,
  PaginationMeta,
  BreakingChange,
  SafeChange,
  CompatReport,
  components,
} from "core";

type Spec = components["schemas"]["Spec"];
type SpecVersion = components["schemas"]["SpecVersion"];
type GatewayConfig = components["schemas"]["GatewayConfig"];
type GatewayConfigVersion = components["schemas"]["GatewayConfigVersion"];

// Client unwraps the envelope before passing to output functions, so use the inner data types
type PushData = PushSpecResponse["data"];
type ValidateData = ValidateSpecResponse["data"];

// Brand color palette — mirrors grapity.dev design tokens
const c = {
  success:    chalk.hex("#a5f3c4"),
  successDim: chalk.hex("#a5f3c4").dim,
  error:      chalk.hex("#f43f5e"),
  errorBold:  chalk.hex("#f43f5e").bold,
  warning:    chalk.hex("#f59e0b"),
  accent:     chalk.hex("#6366f1").bold,
  accentDim:  chalk.hex("#6366f1"),
  cyan:       chalk.hex("#06b6d4"),
  label:      chalk.hex("#8888a0"),
  primary:    chalk.hex("#e4e4ed"),
  dim:        chalk.hex("#8888a0").dim,
};

// Syntax highlighting palette — decoupled from UI semantic colors
const sh = {
  key:         chalk.hex("#818cf8"),
  string:      chalk.hex("#a5f3c4"),
  number:      chalk.hex("#06b6d4"),
  boolean:     chalk.hex("#c084fc"),
  null:        chalk.hex("#c084fc"),
  comment:     chalk.hex("#6b7280"),
  punctuation: chalk.hex("#4b5563"),
};

const DIVIDER = `  ${c.dim("─".repeat(40))}`;
const MAX_CHANGE_ITEMS = 5;

function labelLine(label: string, value: string): string {
  return `  ${c.label(label.padEnd(11))}  ${value}`;
}

function changeItems(breaking: BreakingChange[], safe: SafeChange[]): string[] {
  const items = [
    ...breaking.map((b) => ({ rule: b.rule, path: b.path })),
    ...safe.map((s) => ({ rule: s.rule, path: s.path })),
  ];
  const shown = items.slice(0, MAX_CHANGE_ITEMS);
  const remaining = items.length - shown.length;
  const lines = shown.map(
    ({ rule, path }) => `    ↳ ${c.primary(rule.padEnd(36))} ${c.dim(path)}`
  );
  if (remaining > 0) {
    lines.push(`    ↳ ${c.dim(`… and ${remaining} more`)}`);
  }
  return lines;
}

const ALLOWED_RULES = new Set([
  "endpoint-removed",
  "param-removed",
  "request-body-property-removed",
  "response-property-removed",
]);

function isBlocked(change: BreakingChange): boolean {
  return !ALLOWED_RULES.has(change.rule);
}

export function formatPushResult(
  result: PushData,
  options?: { force?: boolean; reason?: string }
): string {
  const lines: string[] = [];
  const name = c.accent(result.spec.name);
  const type = c.cyan(result.spec.type);

  lines.push(`  ${c.success("✓")} ${name}  ${type}  validated`);

  if (result.compatReport) {
    const { breakingChanges, safeChanges, previousVersion, classification } = result.compatReport;
    const bCount = breakingChanges.length;
    const sCount = safeChanges.length;
    const range = c.dim(`${previousVersion} → ${result.version.semver}`);

    const blockedCount = breakingChanges.filter(isBlocked).length;
    const allowedCount = bCount - blockedCount;

    if (blockedCount > 0) {
      // Force push — blocked changes were overridden
      const bText = c.errorBold(`${blockedCount} blocked`);
      const aText = allowedCount > 0 ? c.warning(`${allowedCount} allowed`) : "";
      const summary = allowedCount > 0
        ? `${bText} ${c.label("·")} ${aText}`
        : bText;
      lines.push(`  ${c.accentDim("◆")} ${summary} ${c.label("·")} ${c.successDim(`${sCount} safe`)}  ${c.label("·")}  ${range}`);
      lines.push(...changeItems(breakingChanges, safeChanges));
    } else if (allowedCount > 0) {
      // All breaking changes are sunset-eligible — friendly descriptions
      const rText = allowedCount === 1
        ? c.successDim("1 sunset-eligible removal")
        : c.successDim(`${allowedCount} sunset-eligible removals`);
      lines.push(`  ${c.accentDim("◆")} ${rText} ${c.label("·")} ${c.successDim(`${sCount} safe`)}  ${c.label("·")}  ${range}`);
      lines.push("");

      lines.push(`  ${c.successDim("Sunset-eligible removals:")}`);
      for (const change of breakingChanges) {
        lines.push(`    ↳ ${c.dim(change.description)}`);
      }
      lines.push("");

      if (sCount > 0) {
        lines.push(`  ${c.successDim("Safe:")}`);
        for (const change of safeChanges) {
          lines.push(`    ↳ ${c.dim(change.description)}`);
        }
        lines.push("");
      }

      lines.push(`  ${c.dim("›")} ${c.primary(`Will bump to ${classification}`)}`);
    } else {
      // No breaking changes at all
      lines.push(`  ${c.accentDim("◆")} ${c.successDim(`${sCount} safe`)}  ${c.label("·")}  ${range}`);
      if (sCount > 0) {
        lines.push("");
        lines.push(`  ${c.successDim("Safe:")}`);
        for (const change of safeChanges) {
          lines.push(`    ↳ ${c.dim(change.description)}`);
        }
        lines.push("");
      }
      lines.push(`  ${c.dim("›")} ${c.primary(`Will bump to ${classification}`)}`);
    }
  }

  if (result.isNewSpec) {
    lines.push(`  ${c.success("✓")} Spec ${name} created`);
  }

  if (options?.force) {
    const reasonPart = options.reason
      ? ` ${c.label("·")} reason: ${c.primary(options.reason)}`
      : "";
    lines.push(`  ${c.warning("⚠")}  ${c.warning("Force push")}${reasonPart}`);
  }

  lines.push(`  ${c.accentDim("◆")} Version ${c.accent(result.version.semver)} registered`);
  return lines.join("\n");
}

export function formatValidateResult(result: ValidateData): string {
  // Structural errors — no compatReport means the spec itself is invalid
  const hasCompatReport = "compatReport" in result && result.compatReport !== undefined;

  if (!hasCompatReport && !result.valid) {
    const errors = result.errors ?? ["Unknown errors"];
    const header = `  ${c.errorBold("✗")} ${c.errorBold("Spec is invalid")}  ${c.dim(`(${errors.length} ${errors.length === 1 ? "error" : "errors"})`)}`;
    const items = errors.map((e) => `    ↳ ${c.primary(e)}`);
    return [header, "", ...items].join("\n");
  }

  if (!hasCompatReport && result.valid) {
    return `  ${c.success("✓")}  Spec is valid`;
  }

  // Breaking changes — compatReport present with valid: true but allowed breaking changes exist
  if (hasCompatReport && result.valid && result.compatReport!.breakingChanges.length > 0) {
    const report = result.compatReport!;
    const bCount = report.breakingChanges.length;
    const sCount = report.safeChanges.length;
    const header = `  ${c.success("✓")}  No blocked changes — push allowed  ${c.dim(`(${bCount} ${bCount === 1 ? "sunset-eligible removal" : "sunset-eligible removals"})`)}`;
    const lines = [header, ""];

    lines.push(`  ${c.successDim("Breaking (allowed):")}`);
    for (const change of report.breakingChanges) {
      lines.push(`    ↳ ${c.dim(change.description)}`);
    }
    lines.push("");

    if (sCount > 0) {
      lines.push(`  ${c.successDim("Safe:")}`);
      for (const change of report.safeChanges.slice(0, 3)) {
        lines.push(`    ↳ ${c.dim(change.description)}`);
      }
      if (sCount > 3) {
        lines.push(`    ↳ ${c.dim(`... and ${sCount - 3} more`)}`);
      }
      lines.push("");
    }

    lines.push(`  ${c.dim("›")} ${c.primary(`Will bump to ${report.classification}`)}`);
    return lines.join("\n");
  }

  // Breaking changes — compatReport present with blocked breaking changes
  if (hasCompatReport && !result.valid) {
    const report = result.compatReport!;
    const allowedRules = new Set([
      "endpoint-removed",
      "param-removed",
      "request-body-property-removed",
      "response-property-removed",
    ]);
    const blockedCount = report.breakingChanges.filter((b) => !allowedRules.has(b.rule)).length;
    const allowedCount = report.breakingChanges.filter((b) => allowedRules.has(b.rule)).length;
    const sCount = report.safeChanges.length;
    const header = `  ${c.errorBold("✗")} ${c.errorBold("Breaking changes detected")}  ${c.dim(`(${blockedCount} blocked`)}${allowedCount > 0 ? c.dim(`, ${allowedCount} allowed`) : ""}${c.dim(`)`)}`;
    const lines = [header, ""];

    if (blockedCount > 0) {
      lines.push(`  ${c.errorBold("Breaking (blocked):")}`);
      for (const change of report.breakingChanges.filter((b) => !allowedRules.has(b.rule))) {
        lines.push(`    ↳ ${c.primary(change.description)}`);
      }
      lines.push("");
    }

    if (allowedCount > 0) {
      lines.push(`  ${c.successDim("Breaking (allowed):")}`);
      for (const change of report.breakingChanges.filter((b) => allowedRules.has(b.rule))) {
        lines.push(`    ↳ ${c.dim(change.description)}`);
      }
      lines.push("");
    }

    if (sCount > 0) {
      lines.push(`  ${c.successDim("Safe:")}`);
      for (const change of report.safeChanges.slice(0, 3)) {
        lines.push(`    ↳ ${c.dim(change.description)}`);
      }
      if (sCount > 3) {
        lines.push(`    ↳ ${c.dim(`... and ${sCount - 3} more`)}`);
      }
      lines.push("");
    }

    lines.push(`  ${c.dim("›")} ${c.primary("To push anyway:")}`);
    lines.push(`    ${c.dim("grapity registry push <file> --name <name> --force --reason \"...\"")}`);
    return lines.join("\n");
  }

  // No breaking changes — compatReport present with valid: true
  const report = result.compatReport!;
  const sCount = report.safeChanges.length;
  const classification = report.classification;
  const lines: string[] = [];

  if (sCount === 0) {
    lines.push(`  ${c.success("✓")}  No changes detected`);
  } else {
    lines.push(`  ${c.success("✓")}  No breaking changes detected  ${c.dim(`(${sCount} safe ${sCount === 1 ? "change" : "changes"})`)}`);
    lines.push("");
    lines.push(`  ${c.successDim("Safe:")}`);
    for (const change of report.safeChanges.slice(0, 3)) {
      lines.push(`    ↳ ${c.dim(change.description)}`);
    }
    if (sCount > 3) {
      lines.push(`    ↳ ${c.dim(`... and ${sCount - 3} more`)}`);
    }
    lines.push("");
    lines.push(`  ${c.dim("›")} ${c.primary(`Will bump to ${classification}`)}`);
  }

  return lines.join("\n");
}

export function formatBlockedPush(report: CompatReport): string {
  const lines: string[] = [];
  const bCount = report.breakingChanges.length;
  const sCount = report.safeChanges.length;

  lines.push(`  ${c.errorBold("✗")}  Push blocked — ${bCount} breaking ${bCount === 1 ? "change" : "changes"} detected`);
  lines.push("");

  if (bCount > 0) {
    lines.push(`  ${c.errorBold("Breaking:")}`);
    for (const change of report.breakingChanges) {
      lines.push(`    ↳ ${c.primary(change.rule.padEnd(40))} ${c.dim(change.path)}`);
      lines.push(`       ${c.dim(change.description)}`);
    }
    lines.push("");
  }

  lines.push(`  ${c.dim("›")} ${c.primary("To push anyway:")}`);
  lines.push(`    ${c.dim("grapity registry push <file> --name <name> --force --reason \"...\"")}`);

  return lines.join("\n");
}

export function formatSpec(spec: Spec & { latestVersion?: SpecVersion }): string {
  const name = c.accent(spec.name);
  const type = c.cyan(spec.type);
  const tags = spec.tags.length > 0 ? c.primary(spec.tags.join(", ")) : c.dim("no tags");
  const owner = spec.owner ? c.primary(spec.owner) : c.dim("unknown");
  const latest = spec.latestVersion ? c.accent(spec.latestVersion.semver) : c.dim("no version");
  return [
    `  ${c.accentDim("▸")} ${name}  ${type}`,
    `    ${c.label("Owner")}  ${owner}    ${c.label("Tags")}  ${tags}`,
    `    ${c.label("Latest")}  ${latest}`,
  ].join("\n");
}

export function formatGatewayConfig(config: GatewayConfig): string {
  const name = c.accent(config.name);
  const provider = c.cyan(config.provider);
  const specRef = c.primary(`${config.specName}@${config.specSemver}`);
  return [
    `  ${c.accentDim("▸")} ${name}  ${provider}`,
    `    ${c.label("Spec")}  ${specRef}`,
  ].join("\n");
}

export function formatGatewayConfigDetail(
  config: GatewayConfig,
  version: GatewayConfigVersion | null
): string {
  const lines: string[] = [];
  const name = c.accent(config.name);
  const provider = c.cyan(config.provider);

  lines.push(`  ${c.accentDim("▸")} ${name}  ${provider}`);
  lines.push("");
  lines.push(labelLine("Spec", c.primary(`${config.specName}@${config.specSemver}`)));

  if (version) {
    lines.push(labelLine("Version", c.primary(version.id)));
    if (version.pushedBy) {
      lines.push(labelLine("Pushed by", c.primary(version.pushedBy)));
    }
    lines.push(labelLine("Created", c.dim(String(version.createdAt))));
  } else {
    lines.push(labelLine("Created", c.dim(String(config.createdAt))));
    lines.push(labelLine("Updated", c.dim(String(config.updatedAt))));
  }

  return lines.join("\n");
}

export function formatVersion(version: SpecVersion): string {
  const semver = c.accent(version.semver);
  const pre = version.isPrerelease ? `  ${c.warning("pre")}` : "";
  const pushed = c.primary(String(version.createdAt));
  let line2 = `    ${c.label("Pushed")}  ${pushed}`;
  if (version.gitRef) {
    line2 += `    ${c.label("Git")}  ${c.dim(version.gitRef)}`;
  }
  return [`  ${c.accentDim("◆")} ${semver}${pre}`, line2].join("\n");
}

export function formatSpecDetail(spec: Spec, latestVersion?: SpecVersion): string {
  const lines: string[] = [];
  lines.push(`${c.accent(spec.name)}  ${c.cyan(spec.type)}`);
  lines.push("");

  if (spec.description) lines.push(labelLine("Description", c.primary(spec.description)));
  if (spec.owner)       lines.push(labelLine("Owner",       c.primary(spec.owner)));
  if (spec.sourceRepo)  lines.push(labelLine("Source",      c.primary(spec.sourceRepo)));
  if (spec.tags.length > 0) lines.push(labelLine("Tags",   c.primary(spec.tags.join(", "))));
  lines.push(labelLine("Created", c.dim(String(spec.createdAt))));

  lines.push("");
  lines.push(DIVIDER);
  lines.push(`  ${c.label("Latest version")}`);
  lines.push("");

  if (latestVersion) {
    const pre = latestVersion.isPrerelease ? `  ${c.warning("pre")}` : "";
    lines.push(`  ${c.accentDim("◆")} ${c.accent(latestVersion.semver)}${pre}`);
    if (latestVersion.pushedBy) lines.push(labelLine("Pushed by", c.primary(latestVersion.pushedBy)));
    if (latestVersion.gitRef)   lines.push(labelLine("Git",       c.dim(latestVersion.gitRef)));
  } else {
    lines.push(`  ${c.dim("· No versions yet.")}`);
  }

  return lines.join("\n");
}

export function formatDeleteSuccess(name: string): string {
  return `  ${c.success("✓")}  Deleted spec ${c.accent(name)} and all versions`;
}

export function formatError(descriptor: string, message: string, hints: string[] = []): string {
  const lines = [
    `  ${c.errorBold("error")}  ${c.error(descriptor)}`,
    "",
    `  ${c.primary(message)}`,
  ];
  if (hints.length > 0) {
    lines.push("");
    for (const hint of hints) {
      lines.push(`  ${c.dim("›")} ${c.primary(hint)}`);
    }
  }
  return lines.join("\n");
}

export function formatInitSuccess(params: {
  configPath: string;
  mode: "local" | "remote";
  port?: number;
  dbPath?: string;
  url?: string;
}): string {
  const lines = [
    `  ${c.success("✓")} Configuration written to ${c.dim(params.configPath)}`,
    "",
    `  ${c.label("Mode")}  ${c.primary(params.mode)}`,
  ];

  if (params.mode === "local") {
    if (params.port) lines.push(`  ${c.label("Port")}  ${c.cyan(String(params.port))}`);
    if (params.dbPath) lines.push(`  ${c.label("Database")}  ${c.dim(params.dbPath)}`);
    lines.push("");
    lines.push(`  ${c.dim("›")} Start the server with:  ${c.primary("grapity serve")}`);
  } else {
    if (params.url) lines.push(`  ${c.label("URL")}  ${c.cyan(params.url)}`);
    lines.push("");
    lines.push(`  ${c.dim("›")} Push a spec with:  ${c.primary("grapity registry push ./openapi.yaml --name my-api")}`);
  }

  return lines.join("\n");
}

export function formatServeConfig(params: {
  port: number;
  dbPath?: string;
}): string {
  const lines = [
    `  ${c.label("Mode")}      ${c.primary("local")}`,
    `  ${c.label("Port")}      ${c.cyan(String(params.port))}`,
  ];
  if (params.dbPath) lines.push(`  ${c.label("Database")}  ${c.dim(params.dbPath)}`);
  return lines.join("\n");
}

export function formatHubConfig(params: {
  port: number;
  registryUrl: string;
}): string {
  const lines = [
    `  ${c.label("Port")}      ${c.cyan(String(params.port))}`,
    `  ${c.label("Registry")}  ${c.dim(params.registryUrl)}`,
  ];
  return lines.join("\n");
}

export function formatVersionsFooter(pagination: PaginationMeta): string | null {
  if (!pagination.hasMore) return null;
  const from = pagination.offset + 1;
  const to = pagination.offset + pagination.limit;
  return `  ${c.dim(`Showing ${from}–${to} of ${pagination.total}  ·  --offset ${to} to see more`)}`;
}

export function formatHeader(title: string, meta?: string): string {
  const metaPart = meta ? `  ${c.label("·")}  ${c.dim(meta)}` : "";
  return `  ${c.accentDim("◆")}  ${c.accent(title)}${metaPart}`;
}

export function formatEmptyState(message: string, hints?: string[]): string {
  const lines = [`  ${c.dim("·")} ${c.dim(message)}`];
  if (hints && hints.length > 0) {
    lines.push("");
    for (const hint of hints) {
      lines.push(`  ${c.dim("›")} ${c.primary(hint)}`);
    }
  }
  return lines.join("\n");
}

export function formatReady(port: number): string {
  return `  ${c.success("●")}  Server ready  ${c.label("·")}  ${c.cyan(`http://localhost:${port}`)}`;
}

export function formatHubReady(port: number): string {
  return `  ${c.success("●")}  Hub ready     ${c.label("·")}  ${c.cyan(`http://localhost:${port}`)}`;
}

export function formatShutdown(): string {
  return `  ${c.accentDim("◆")}  Shutting down grapity`;
}

// ─── Syntax highlighting for spec documents ───
// These functions add ANSI color codes for TTY display only.
// They never modify the underlying data or contract semantics.

function highlightJsonValue(value: unknown, indent: number): string {
  const spaces = "  ".repeat(indent);

  if (value === null) return sh.null("null");
  if (typeof value === "boolean") return sh.boolean(String(value));
  if (typeof value === "number") return sh.number(String(value));
  if (typeof value === "string") return sh.string(JSON.stringify(value));

  if (Array.isArray(value)) {
    if (value.length === 0) return sh.punctuation("[]");
    const items = value.map((v) => `${spaces}  ${highlightJsonValue(v, indent + 1)}`);
    return `${sh.punctuation("[")}\n${items.join(",\n")}\n${spaces}${sh.punctuation("]")}`;
  }

  if (typeof value === "object" && value !== null) {
    const entries = Object.entries(value);
    if (entries.length === 0) return sh.punctuation("{}");
    const items = entries.map(([k, v]) => {
      return `${spaces}  ${sh.key(JSON.stringify(k))}: ${highlightJsonValue(v, indent + 1)}`;
    });
    return `${sh.punctuation("{")}\n${items.join(",\n")}\n${spaces}${sh.punctuation("}")}`;
  }

  return String(value);
}

export function highlightJson(json: string): string {
  return highlightJsonValue(JSON.parse(json), 0);
}

function findYamlCommentIndex(line: string): number {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const prev = i > 0 ? line[i - 1] : "";

    if (char === "'" && !inDoubleQuote && prev !== "\\") {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote && prev !== "\\") {
      inDoubleQuote = !inDoubleQuote;
    } else if (
      char === "#" &&
      !inSingleQuote &&
      !inDoubleQuote &&
      (i === 0 || line[i - 1] === " " || line[i - 1] === "\t")
    ) {
      return i;
    }
  }

  return -1;
}

function highlightYamlScalar(value: string): string {
  const trimmed = value.trimStart();
  const leading = value.slice(0, value.length - trimmed.length);

  if (!trimmed) return value;

  // Nested key: value inside arrays or block sequences
  const nestedKeyMatch = trimmed.match(/^([^:\s].*?)(\s*:\s*)(.*)$/);
  if (nestedKeyMatch) {
    const [, key, sep, rest] = nestedKeyMatch;
    return leading + sh.key(key) + sep + highlightYamlScalar(rest);
  }

  // Quoted strings
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return leading + sh.string(trimmed);
  }

  // Numbers
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(trimmed)) {
    return leading + sh.number(trimmed);
  }

  // Booleans and null
  if (/^(?:true|false|null|~|yes|no|on|off)$/.test(trimmed)) {
    return leading + sh.boolean(trimmed);
  }

  // Unquoted strings
  return leading + sh.string(trimmed);
}

export function highlightYaml(yamlContent: string): string {
  return yamlContent
    .split("\n")
    .map((line) => {
      // Empty lines
      if (!line.trim()) return line;

      // Find inline comment
      const commentIdx = findYamlCommentIndex(line);
      let content = line;
      let comment = "";
      if (commentIdx !== -1) {
        content = line.slice(0, commentIdx);
        comment = sh.comment(line.slice(commentIdx));
      }

      // Full-line comments
      if (content.trimStart().startsWith("#")) {
        return sh.comment(line);
      }

      // Key: value
      const keyMatch = content.match(/^(\s*)([^:\s].*?)(\s*:\s*)(.*)$/);
      if (keyMatch) {
        const [, indent, key, sep, value] = keyMatch;
        return indent + sh.key(key) + sep + highlightYamlScalar(value) + comment;
      }

      // Array item: - value
      const arrMatch = content.match(/^(\s*-\s)(.*)$/);
      if (arrMatch) {
        return arrMatch[1] + highlightYamlScalar(arrMatch[2]) + comment;
      }

      return content + comment;
    })
    .join("\n");
}
