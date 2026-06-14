import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import os from "node:os";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";

const tmpHome = mkdtempSync(join(tmpdir(), "grapity-serve-test-"));
const realHomedir = os.homedir.bind(os);

beforeAll(() => {
  os.homedir = () => tmpHome;
});

afterAll(() => {
  os.homedir = realHomedir;
  rmSync(tmpHome, { recursive: true, force: true });
});

function writeConfig(config: object) {
  const dir = join(tmpHome, ".grapity");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "config.yaml"), yaml.dump(config), "utf-8");
}

async function runServe(
  args: string[],
  envOverrides?: Record<string, string>
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(["bun", "run", "src/cli/index.ts", "serve", "--no-hub", ...args], {
    cwd: "/Users/marcos/workspace/grapity/grapity",
    env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome, ...envOverrides },
    stdout: "pipe",
    stderr: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

function strip(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, "");
}

describe("grapity serve", () => {
  test("exits with a friendly error when PostgreSQL is unreachable", async () => {
    writeConfig({
      mode: "local",
      local: {
        port: 3750,
        database: "postgresql",
        postgresUrl: "postgresql://grapity:grapity@127.0.0.1:1/grapity",
      },
    });

    const { exitCode, stderr } = await runServe(["--no-auth"]);

    expect(exitCode).toBe(1);
    const plain = strip(stderr);
    expect(plain).toContain("PostgreSQL is not reachable");
    expect(plain).toContain("postgresql://grapity:***@127.0.0.1:1/grapity");
    expect(plain).not.toContain("DrizzleQueryError");
  });
});
