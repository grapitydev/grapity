import { test, expect, describe, beforeAll, afterAll, beforeEach } from "bun:test";
import os from "node:os";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";

// init.ts writes to os.homedir(); monkey-patch it to a temp dir.
const tmpHome = mkdtempSync(join(tmpdir(), "grapity-init-test-"));
const realHomedir = os.homedir.bind(os);
const repoRoot = import.meta.dirname
  ? join(import.meta.dirname, "../..")
  : process.cwd();

beforeAll(() => {
  os.homedir = () => tmpHome;
});

afterAll(() => {
  os.homedir = realHomedir;
  rmSync(tmpHome, { recursive: true, force: true });
});

beforeEach(() => {
  rmSync(join(tmpHome, ".grapity"), { recursive: true, force: true });
});

async function runInit(
  args: string[],
  envOverrides?: Record<string, string>
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", "run", "src/cli/index.ts", "init", ...args], {
    cwd: repoRoot,
    env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome, ...envOverrides },
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

function readConfig(): unknown {
  const configPath = join(tmpHome, ".grapity", "config.yaml");
  const content = readFileSync(configPath, "utf-8");
  return yaml.load(content);
}

describe("grapity init --local --db", () => {
  test("writes sqlite config when --db is a file path", async () => {
    const { exitCode } = await runInit(["--local", "--db", "/data/grapity.db"]);
    expect(exitCode).toBe(0);

    const config = readConfig() as any;
    expect(config.mode).toBe("local");
    expect(config.local.database).toBe("sqlite");
    expect(config.local.sqlitePath).toBe("/data/grapity.db");
  });

  test("writes postgresql config when --db is a postgresql url", async () => {
    const { exitCode } = await runInit(["--local", "--db", "postgresql://user:pass@localhost:5433/grapity"]);
    expect(exitCode).toBe(0);

    const config = readConfig() as any;
    expect(config.mode).toBe("local");
    expect(config.local.database).toBe("postgresql");
    expect(config.local.postgresUrl).toBe("postgresql://user:pass@localhost:5433/grapity");
  });

  test("defaults to sqlite with default path when --db is omitted", async () => {
    const { exitCode } = await runInit(["--local"]);
    expect(exitCode).toBe(0);

    const config = readConfig() as any;
    expect(config.mode).toBe("local");
    expect(config.local.database).toBe("sqlite");
    expect(config.local.sqlitePath).toBe(join(tmpHome, ".grapity", "registry.db"));
  });

  test("writes postgresql config from GRAPITY_DATABASE_URL when --db is omitted", async () => {
    const { exitCode } = await runInit(["--local"], {
      GRAPITY_DATABASE_URL: "postgresql://grapity:grapity@localhost:5433/grapity",
    });
    expect(exitCode).toBe(0);

    const config = readConfig() as any;
    expect(config.mode).toBe("local");
    expect(config.local.database).toBe("postgresql");
    expect(config.local.postgresUrl).toBe("postgresql://grapity:grapity@localhost:5433/grapity");
  });

  test("--db flag takes precedence over GRAPITY_DATABASE_URL", async () => {
    const { exitCode } = await runInit(
      ["--local", "--db", "/data/grapity.db"],
      { GRAPITY_DATABASE_URL: "postgresql://grapity:grapity@localhost:5433/grapity" }
    );
    expect(exitCode).toBe(0);

    const config = readConfig() as any;
    expect(config.local.database).toBe("sqlite");
    expect(config.local.sqlitePath).toBe("/data/grapity.db");
  });
});
