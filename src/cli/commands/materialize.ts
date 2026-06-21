// CLI REFERENCE: grapity.dev/docs/cli-reference/materialize.md
// If you add or change flags/behavior, update the doc above.

import { Command } from "commander";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { client } from "../client";
import { formatError, formatHeader } from "../output";

export const CONFIG_FILENAME = "grapity.yaml";
export const LOCKFILE_FILENAME = "grapity-lock.json";
const CONFIG_VERSION = "1";
const LOCKFILE_VERSION = "1";

export interface ProjectConfig {
  version: string;
  specs: ProjectSpec[];
}

export interface ProjectSpec {
  name: string;
  semver?: string;
  output?: string;
  format?: "yaml" | "json";
}

interface Lockfile {
  version: string;
  specs: Record<string, LockfileEntry>;
}

interface LockfileEntry {
  requested: string;
  resolved: string;
  latest: string;
  stale: boolean;
  fetchedAt: string;
}

export interface MaterializeOptions {
  cwd: string;
  semver?: string;
  output?: string;
  format?: "yaml" | "json";
  force?: boolean;
  failOnStale?: boolean;
}

export interface MaterializeDeps {
  fetchSpec: typeof client.fetchSpec;
  getSpec: typeof client.getSpec;
}

export interface CheckOptions {
  cwd: string;
  failOnStale?: boolean;
}

export interface CheckDeps {
  getSpec: typeof client.getSpec;
}

interface MaterializeResult {
  name: string;
  resolvedVersion: string;
  latestVersion: string;
  stale: boolean;
  alreadyUpToDate: boolean;
}

function getDefaultOutputPath(name: string): string {
  return `./grapity/specs/${name}.yaml`;
}

export function readProjectConfig(cwd: string, configPath?: string): ProjectConfig | null {
  const filePath = configPath ? path.resolve(cwd, configPath) : path.join(cwd, CONFIG_FILENAME);
  if (!fs.existsSync(filePath)) return null;
  try {
    return yaml.load(fs.readFileSync(filePath, "utf-8")) as ProjectConfig;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to parse ${path.basename(filePath)}: ${message}`);
  }
}

export function writeProjectConfig(cwd: string, config: ProjectConfig, configPath?: string): void {
  const filePath = configPath ? path.resolve(cwd, configPath) : path.join(cwd, CONFIG_FILENAME);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, yaml.dump(config), "utf-8");
}

function readLockfile(cwd: string): Lockfile | null {
  const lockPath = path.join(cwd, LOCKFILE_FILENAME);
  if (!fs.existsSync(lockPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(lockPath, "utf-8")) as Lockfile;
  } catch {
    return null;
  }
}

function writeLockfile(cwd: string, lockfile: Lockfile): void {
  const lockPath = path.join(cwd, LOCKFILE_FILENAME);
  fs.writeFileSync(lockPath, JSON.stringify(lockfile, null, 2) + "\n", "utf-8");
}

function normalizeSemver(semver: string | undefined): string | undefined {
  return semver?.trim().replace(/[,;.:]+$/, "");
}

function specsAreEqual(a: string, b: string): boolean {
  try {
    const parsedA = yaml.load(a) as Record<string, unknown> | null;
    const parsedB = yaml.load(b) as Record<string, unknown> | null;
    return JSON.stringify(parsedA) === JSON.stringify(parsedB);
  } catch {
    return a === b;
  }
}

function resolveOutputPath(cwd: string, name: string, output?: string): string {
  const relativePath = output ?? getDefaultOutputPath(name);
  return path.resolve(cwd, relativePath);
}

function updateProjectConfig(
  config: ProjectConfig | null,
  name: string,
  resolvedSemver: string,
  output?: string,
  format?: "yaml" | "json"
): ProjectConfig {
  const next: ProjectConfig = config ?? { version: CONFIG_VERSION, specs: [] };
  const existingIndex = next.specs.findIndex((s) => s.name === name);

  const newSpec: ProjectSpec = {
    name,
    semver: resolvedSemver,
    output: output ?? (existingIndex >= 0 ? next.specs[existingIndex].output : undefined) ?? getDefaultOutputPath(name),
    format: format ?? (existingIndex >= 0 ? next.specs[existingIndex].format : undefined) ?? "yaml",
  };

  if (existingIndex >= 0) {
    next.specs[existingIndex] = newSpec;
  } else {
    next.specs.push(newSpec);
  }

  return next;
}

export async function materialize(
  name: string | undefined,
  options: MaterializeOptions,
  deps: MaterializeDeps = { fetchSpec: client.fetchSpec, getSpec: client.getSpec },
  configPath?: string
): Promise<MaterializeResult[]> {
  const cwd = options.cwd;
  const config = readProjectConfig(cwd, configPath);

  if (!name) {
    if (!config || config.specs.length === 0) {
      throw new Error(`No spec name provided and no specs declared in ${CONFIG_FILENAME}.`);
    }
    const results: MaterializeResult[] = [];
    for (const spec of config.specs) {
      results.push(await materializeOne(spec.name, options, deps, config, configPath));
    }
    return results;
  }

  const configSpec = config?.specs.find((s) => s.name === name);
  const semver = normalizeSemver(options.semver ?? configSpec?.semver);

  return [await materializeOne(name, options, deps, config, configPath)];
}

async function materializeOne(
  name: string,
  options: MaterializeOptions,
  deps: MaterializeDeps,
  config: ProjectConfig | null,
  configPath?: string
): Promise<MaterializeResult> {
  const cwd = options.cwd;
  const configSpec = config?.specs.find((s) => s.name === name);

  let requestedVersion = normalizeSemver(options.semver ?? configSpec?.semver);

  const outputPath = resolveOutputPath(cwd, name, options.output ?? configSpec?.output);
  const format = options.format ?? configSpec?.format ?? "yaml";

  const { content, resolvedVersion: resolvedFromHeader } = await deps.fetchSpec(name, {
    semver: requestedVersion,
    format,
  });

  const resolvedVersion = resolvedFromHeader ?? requestedVersion;
  if (!resolvedVersion) {
    throw new Error(`Could not determine resolved version for spec "${name}".`);
  }

  const specMetadata = await deps.getSpec(name);
  const latestVersion = specMetadata.latestVersion?.semver ?? resolvedVersion;
  const stale = resolvedVersion !== latestVersion;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let alreadyUpToDate = false;
  if (fs.existsSync(outputPath)) {
    const existing = fs.readFileSync(outputPath, "utf-8");
    if (specsAreEqual(existing, content)) {
      alreadyUpToDate = true;
    } else if (!options.force) {
      throw new Error(
        `File "${path.relative(cwd, outputPath)}" already exists and differs from ${name}@${resolvedVersion}. Run with --force to overwrite.`
      );
    }
  }

  if (!alreadyUpToDate) {
    fs.writeFileSync(outputPath, content, "utf-8");
  }

  const updatedConfig = updateProjectConfig(
    config,
    name,
    resolvedVersion,
    options.output ?? configSpec?.output,
    format
  );
  writeProjectConfig(cwd, updatedConfig, configPath);

  const lockfile = readLockfile(cwd) ?? { version: LOCKFILE_VERSION, specs: {} };
  lockfile.specs[name] = {
    requested: requestedVersion ?? resolvedVersion,
    resolved: resolvedVersion,
    latest: latestVersion,
    stale,
    fetchedAt: new Date().toISOString(),
  };
  writeLockfile(cwd, lockfile);

  if (stale && options.failOnStale) {
    throw new Error(`${name}@${resolvedVersion} is not the latest version (${latestVersion}).`);
  }

  return { name, resolvedVersion, latestVersion, stale, alreadyUpToDate };
}

export interface CheckResult {
  name: string;
  resolved: string;
  latest: string;
  stale: boolean;
}

export async function check(
  options: CheckOptions,
  deps: CheckDeps = { getSpec: client.getSpec },
  configPath?: string
): Promise<Record<string, CheckResult>> {
  const cwd = options.cwd;
  const config = readProjectConfig(cwd, configPath);
  const lockfile = readLockfile(cwd);

  if (!lockfile) {
    throw new Error(`Lockfile "${LOCKFILE_FILENAME}" not found. Run "grapity materialize" first.`);
  }

  const specNames = new Set<string>([
    ...Object.keys(lockfile.specs),
    ...(config?.specs.map((s) => s.name) ?? []),
  ]);

  const results: Record<string, CheckResult> = {};
  let anyStale = false;

  for (const name of specNames) {
    const metadata = await deps.getSpec(name);
    const latest = metadata.latestVersion?.semver;
    const resolved = lockfile.specs[name]?.resolved ?? latest ?? "unknown";
    const stale = latest !== undefined && resolved !== latest;
    if (stale) anyStale = true;

    results[name] = { name, resolved, latest: latest ?? resolved, stale };
  }

  if (anyStale && options.failOnStale) {
    const staleSpecs = Object.values(results)
      .filter((r) => r.stale)
      .map((r) => `${r.name}@${r.resolved} (latest: ${r.latest})`)
      .join(", ");
    throw new Error(`Stale specs detected: ${staleSpecs}`);
  }

  return results;
}

export const materializeCommand = new Command("materialize")
  .description("Fetch registered specs into the current repository")
  .argument("[name]", "Name of the spec to materialize; omit to materialize all specs from grapity.yaml")
  .option("--semver <semver>", "Specific version")
  .option("--output <path>", "Destination path for the spec")
  .option("--format <format>", "Output format: yaml or json")
  .option("--force", "Overwrite an existing file even if it differs")
  .option("--fail-on-stale", "Exit with an error when the resolved version is not the latest")
  .option("--config <path>", "Path to grapity.yaml", CONFIG_FILENAME)
  .option("--check", "Verify lockfile specs are still the latest registry versions")
  .action(async (name, options) => {
    try {
      const cwd = process.cwd();

      if (options.check) {
        const results = await check({ cwd, failOnStale: options.failOnStale }, undefined, options.config);
        const entries = Object.values(results);

        for (const result of entries) {
          const meta = result.stale
            ? `${result.resolved} → latest ${result.latest}`
            : `${result.resolved} (latest)`;
          console.log(formatHeader(result.name, meta));
        }

        if (entries.some((r) => r.stale)) {
          const staleNames = entries.filter((r) => r.stale).map((r) => r.name);
          console.warn(`Warning: stale specs detected: ${staleNames.join(", ")}`);
          process.exitCode = options.failOnStale ? 1 : 0;
        }

        return;
      }

      const results = await materialize(
        name,
        {
          cwd,
          semver: options.semver,
          output: options.output,
          format: options.format,
          force: options.force,
          failOnStale: options.failOnStale,
        },
        undefined,
        options.config
      );

      for (const result of results) {
        const config = readProjectConfig(cwd, options.config);
        const configSpec = config?.specs.find((s) => s.name === result.name);
        const outputPath = resolveOutputPath(cwd, result.name, configSpec?.output);
        const relativePath = path.relative(cwd, outputPath);

        if (result.alreadyUpToDate) {
          console.log(formatHeader(result.name, `${result.resolvedVersion} already materialized`));
          console.log(`  ${relativePath}`);
        } else {
          console.log(formatHeader(result.name, `${result.resolvedVersion} → ${relativePath}`));
        }

        if (result.stale) {
          console.warn(
            `Warning: ${result.name}@${result.resolvedVersion} is not the latest version (${result.latestVersion}).`
          );
        }
      }

      if (results.some((r) => r.stale) && options.failOnStale) {
        process.exitCode = 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(formatError("materialize failed", message));
      process.exit(1);
    }
  });
