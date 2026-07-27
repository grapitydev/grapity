import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import os from "node:os";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import yaml from "js-yaml";

const tmpHome = mkdtempSync(join(tmpdir(), "grapity-validate-test-"));
const realHomedir = os.homedir.bind(os);
const repoRoot = import.meta.dirname ? join(import.meta.dirname, "../..") : process.cwd();

const specPath = join(tmpHome, "spec.yaml");

let stubServer: ReturnType<typeof Bun.serve>;
let stubResponse: unknown;

beforeAll(() => {
  os.homedir = () => tmpHome;
  writeFileSync(specPath, yaml.dump({ openapi: "3.0.3", info: { title: "t", version: "1" }, paths: {} }));
  stubServer = Bun.serve({
    port: 0,
    fetch: () =>
      new Response(JSON.stringify({ data: stubResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
  });
  const dir = join(tmpHome, ".grapity");
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "config.yaml"),
    yaml.dump({ mode: "remote", remote: { url: `http://127.0.0.1:${stubServer.port}` } })
  );
});

afterAll(() => {
  stubServer.stop(true);
  os.homedir = realHomedir;
  rmSync(tmpHome, { recursive: true, force: true });
});

async function runValidate(): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(
    ["bun", "run", "src/cli/index.ts", "registry", "validate", specPath, "--against", "payments-api"],
    {
      cwd: repoRoot,
      env: { ...process.env, HOME: tmpHome, USERPROFILE: tmpHome },
      stdout: "pipe",
      stderr: "pipe",
    }
  );
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

describe("grapity registry validate exit codes", () => {
  test("exits 0 when the spec is valid", async () => {
    stubResponse = { valid: true, errors: [], warnings: [] };
    const { exitCode } = await runValidate();
    expect(exitCode).toBe(0);
  });

  test("exits 1 when the spec is structurally invalid", async () => {
    stubResponse = { valid: false, errors: ["not a valid OpenAPI document"], warnings: [] };
    const { exitCode } = await runValidate();
    expect(exitCode).toBe(1);
  });

  test("exits 1 when the compat report contains blocked breaking changes", async () => {
    stubResponse = {
      valid: false,
      errors: ["removed required param without deprecation"],
      warnings: [],
      compatReport: {
        previousVersion: "1.0.0",
        classification: "major",
        breakingChanges: [{ rule: "param-removed-without-deprecation", description: "removed required param without deprecation" }],
        safeChanges: [],
      },
    };
    const { exitCode } = await runValidate();
    expect(exitCode).toBe(1);
  });

  test("exits 0 for sunset-eligible removals", async () => {
    stubResponse = {
      valid: true,
      errors: [],
      warnings: [],
      compatReport: {
        previousVersion: "1.0.0",
        classification: "major",
        breakingChanges: [{ rule: "param-removed", description: "removed deprecated param past sunset" }],
        safeChanges: [],
      },
    };
    const { exitCode } = await runValidate();
    expect(exitCode).toBe(0);
  });
});
