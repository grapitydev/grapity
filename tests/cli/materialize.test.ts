import { test, expect, describe, beforeEach, afterEach, mock } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";
import {
  materialize,
  check,
  readProjectConfig,
  writeProjectConfig,
  type MaterializeDeps,
  type CheckDeps,
  type ProjectConfig,
  CONFIG_FILENAME,
  LOCKFILE_FILENAME,
} from "cli/commands/materialize";

let tmpRepo: string;

beforeEach(() => {
  tmpRepo = mkdtempSync(join(tmpdir(), "grapity-materialize-repo-"));
});

afterEach(() => {
  rmSync(tmpRepo, { recursive: true, force: true });
});

function createDeps(overrides?: Partial<MaterializeDeps>): MaterializeDeps {
  return {
    fetchSpec: async (_name, { semver }) => ({
      content: `openapi: 3.1.0\ninfo:\n  title: Payments API\n  version: "${semver ?? "1.0.0"}"\n`,
      resolvedVersion: semver ?? "1.0.0",
    }),
    getSpec: async () => ({
      spec: { name: "payments-api" } as any,
      latestVersion: { semver: "2.0.0" } as any,
    }),
    ...overrides,
  };
}

function createCheckDeps(overrides?: Partial<CheckDeps>): CheckDeps {
  return {
      getSpec: async (_name: string) => ({
        spec: { name: "users-api" } as any,
        latestVersion: { semver: "3.0.0" } as any,
      }),
    ...overrides,
  };
}

describe("materialize command", () => {
  test("creates grapity.yaml and writes spec on first materialize", async () => {
    const deps = createDeps();

    await materialize("payments-api", { cwd: tmpRepo, semver: "1.2.0" }, deps);

    const config = readProjectConfig(tmpRepo);
    expect(config).toEqual({
      version: "1",
      specs: [
        {
          name: "payments-api",
          semver: "1.2.0",
          output: "./grapity/specs/payments-api.yaml",
          format: "yaml",
        },
      ],
    });

    const specPath = join(tmpRepo, "grapity", "specs", "payments-api.yaml");
    expect(existsSync(specPath)).toBe(true);

    const lock = JSON.parse(readFileSync(join(tmpRepo, LOCKFILE_FILENAME), "utf-8"));
    expect(lock.specs["payments-api"].resolved).toBe("1.2.0");
  });

  test("resolves latest semver and writes it into grapity.yaml", async () => {
    const deps = createDeps({
      fetchSpec: async (_name, { semver }) => ({
        content: `openapi: 3.1.0\ninfo:\n  title: Payments API\n  version: "${semver ?? "2.0.0"}"\n`,
        resolvedVersion: semver ?? "2.0.0",
      }),
      getSpec: async () => ({
        spec: { name: "payments-api" } as any,
        latestVersion: { semver: "2.0.0" } as any,
      }),
    });

    await materialize("payments-api", { cwd: tmpRepo }, deps);

    const config = readProjectConfig(tmpRepo)!;
    expect(config.specs[0].semver).toBe("2.0.0");

    const lock = JSON.parse(readFileSync(join(tmpRepo, LOCKFILE_FILENAME), "utf-8"));
    expect(lock.specs["payments-api"].resolved).toBe("2.0.0");
  });

  test("adds a new spec to existing grapity.yaml", async () => {
    const deps = createDeps({
      fetchSpec: async (_name, { semver }) => ({
        content: `openapi: 3.1.0\ninfo:\n  title: Test API\n  version: "${semver ?? "1.0.0"}"\n`,
        resolvedVersion: semver ?? "1.0.0",
      }),
      getSpec: async (_name: string) => ({
        spec: { name: "users-api" } as any,
        latestVersion: { semver: "3.0.0" } as any,
      }),
    });

    writeProjectConfig(tmpRepo, {
      version: "1",
      specs: [{ name: "payments-api", semver: "1.2.0", output: "./grapity/specs/payments-api.yaml", format: "yaml" }],
    });

    await materialize("users-api", { cwd: tmpRepo, semver: "3.0.0" }, deps);

    const config = readProjectConfig(tmpRepo)!;
    expect(config.specs).toHaveLength(2);
    expect(config.specs[1]).toEqual({
      name: "users-api",
      semver: "3.0.0",
      output: "./grapity/specs/users-api.yaml",
      format: "yaml",
    });
  });

  test("preserves config format and passes it to fetchSpec when no format option is given", async () => {
    const fetchSpec = mock(async (_name, { semver }) => ({
      content: `openapi: 3.1.0\ninfo:\n  title: Payments API\n  version: "${semver ?? "1.0.0"}"\n`,
      resolvedVersion: semver ?? "1.0.0",
    }));
    const deps = createDeps({ fetchSpec });

    writeProjectConfig(tmpRepo, {
      version: "1",
      specs: [
        {
          name: "payments-api",
          semver: "1.0.0",
          output: "./grapity/specs/payments-api.json",
          format: "json",
        },
      ],
    });

    await materialize("payments-api", { cwd: tmpRepo, semver: "1.2.0" }, deps);

    expect(fetchSpec).toHaveBeenCalledWith("payments-api", { semver: "1.2.0", format: "json" });

    const config = readProjectConfig(tmpRepo)!;
    expect(config.specs[0].format).toBe("json");
    expect(config.specs[0].output).toBe("./grapity/specs/payments-api.json");
  });

  test("materializes all specs from grapity.yaml", async () => {
    const deps = createDeps({
      fetchSpec: async (_name, { semver }) => ({
        content: `openapi: 3.1.0\ninfo:\n  title: Test API\n  version: "${semver ?? "1.0.0"}"\n`,
        resolvedVersion: semver ?? "1.0.0",
      }),
      getSpec: async (name: string) => ({
        spec: { name } as any,
        latestVersion: { semver: name === "payments-api" ? "1.2.0" : "3.0.0" } as any,
      }),
    });

    writeProjectConfig(tmpRepo, {
      version: "1",
      specs: [
        { name: "payments-api", semver: "1.2.0", output: "./grapity/specs/payments-api.yaml", format: "yaml" },
        { name: "users-api", semver: "3.0.0", output: "./grapity/specs/users-api.yaml", format: "yaml" },
      ],
    });

    const result = await materialize(undefined, { cwd: tmpRepo }, deps);
    expect(result).toHaveLength(2);

    expect(existsSync(join(tmpRepo, "grapity", "specs", "payments-api.yaml"))).toBe(true);
    expect(existsSync(join(tmpRepo, "grapity", "specs", "users-api.yaml"))).toBe(true);
  });

  test("is a no-op when existing file matches", async () => {
    const deps = createDeps();

    await materialize("payments-api", { cwd: tmpRepo, semver: "1.0.0" }, deps);
    const firstStat = readFileSync(join(tmpRepo, "grapity", "specs", "payments-api.yaml"), "utf-8");

    const result = await materialize("payments-api", { cwd: tmpRepo, semver: "1.0.0" }, deps);

    const secondStat = readFileSync(join(tmpRepo, "grapity", "specs", "payments-api.yaml"), "utf-8");
    expect(secondStat).toBe(firstStat);
    expect(result[0].alreadyUpToDate).toBe(true);
  });

  test("throws when existing file differs and force is false", async () => {
    const deps = createDeps();
    const specPath = join(tmpRepo, "grapity", "specs", "payments-api.yaml");
    mkdirSync(join(tmpRepo, "grapity", "specs"), { recursive: true });
    writeFileSync(specPath, "openapi: 3.1.0\ninfo:\n  title: Local Draft\n", "utf-8");

    await expect(materialize("payments-api", { cwd: tmpRepo, semver: "1.0.0" }, deps)).rejects.toThrow("already exists");
  });

  test("overwrites when existing file differs and force is true", async () => {
    const deps = createDeps();
    const specPath = join(tmpRepo, "grapity", "specs", "payments-api.yaml");
    mkdirSync(join(tmpRepo, "grapity", "specs"), { recursive: true });
    writeFileSync(specPath, "openapi: 3.1.0\ninfo:\n  title: Local Draft\n", "utf-8");

    await materialize("payments-api", { cwd: tmpRepo, semver: "1.0.0", force: true }, deps);

    const content = readFileSync(specPath, "utf-8");
    expect(content).toContain("Payments API");
  });

  test("throws when fetchSpec reports unknown spec", async () => {
    const deps = createDeps({
      fetchSpec: async () => {
        throw new Error('Spec "payments-api" not found');
      },
    });

    await expect(materialize("payments-api", { cwd: tmpRepo, semver: "1.0.0" }, deps)).rejects.toThrow("not found");
  });

  test("fails with --fail-on-stale when pinned version is not latest", async () => {
    const deps = createDeps();

    await expect(materialize("payments-api", { cwd: tmpRepo, semver: "1.0.0", failOnStale: true }, deps)).rejects.toThrow(
      "not the latest version"
    );
  });
});

describe("check command", () => {
  test("reports stale and fresh specs from lockfile", async () => {
    const deps = createCheckDeps({
      getSpec: async (name: string) => {
        const latest = name === "payments-api" ? "2.0.0" : "3.0.0";
        return { spec: { name } as any, latestVersion: { semver: latest } as any };
      },
    });

    writeFileSync(
      join(tmpRepo, LOCKFILE_FILENAME),
      JSON.stringify(
        {
          version: "1",
          specs: {
            "payments-api": { requested: "1.0.0", resolved: "1.0.0", latest: "1.0.0", stale: false, fetchedAt: "2026-01-01T00:00:00Z" },
            "users-api": { requested: "3.0.0", resolved: "3.0.0", latest: "3.0.0", stale: false, fetchedAt: "2026-01-01T00:00:00Z" },
          },
        },
        null,
        2
      ),
      "utf-8"
    );

    writeProjectConfig(tmpRepo, {
      version: "1",
      specs: [
        { name: "payments-api", semver: "1.0.0", output: "./grapity/specs/payments-api.yaml", format: "yaml" },
        { name: "users-api", semver: "3.0.0", output: "./grapity/specs/users-api.yaml", format: "yaml" },
      ],
    });

    const result = await check({ cwd: tmpRepo, failOnStale: false }, deps);

    expect(result["payments-api"].stale).toBe(true);
    expect(result["users-api"].stale).toBe(false);
  });

  test("fails with --fail-on-stale when any spec is stale", async () => {
    const deps = createCheckDeps();

    writeFileSync(
      join(tmpRepo, LOCKFILE_FILENAME),
      JSON.stringify(
        {
          version: "1",
          specs: {
            "payments-api": { requested: "1.0.0", resolved: "1.0.0", latest: "1.0.0", stale: false, fetchedAt: "2026-01-01T00:00:00Z" },
          },
        },
        null,
        2
      ),
      "utf-8"
    );

    writeProjectConfig(tmpRepo, {
      version: "1",
      specs: [{ name: "payments-api", semver: "1.0.0", output: "./grapity/specs/payments-api.yaml", format: "yaml" }],
    });

    await expect(check({ cwd: tmpRepo, failOnStale: true }, deps)).rejects.toThrow("Stale specs detected");
  });

  test("errors when lockfile is missing", async () => {
    const deps = createCheckDeps();

    await expect(check({ cwd: tmpRepo, failOnStale: false }, deps)).rejects.toThrow("grapity-lock.json");
  });
});

describe("project config helpers", () => {
  test("readProjectConfig returns null when file is missing", () => {
    const config = readProjectConfig(tmpRepo);
    expect(config).toBeNull();
  });

  test("writeProjectConfig creates the config file", () => {
    const config: ProjectConfig = {
      version: "1",
      specs: [{ name: "payments-api", semver: "1.2.0", output: "./grapity/specs/payments-api.yaml", format: "yaml" }],
    };

    writeProjectConfig(tmpRepo, config);

    const read = readProjectConfig(tmpRepo);
    expect(read).toEqual(config);
  });

  test("readProjectConfig throws on invalid YAML", () => {
    writeFileSync(join(tmpRepo, CONFIG_FILENAME), "version: [1", "utf-8");

    expect(() => readProjectConfig(tmpRepo)).toThrow("Failed to parse grapity.yaml");
  });
});
