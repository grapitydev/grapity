import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import type { BunPlugin } from "bun";
import type { EmbeddedAssets, EmbeddedHubFile, EmbeddedMigrations } from "../src/runtime/embedded";

const ROOT = path.resolve(import.meta.dir, "..");
const OUT_DIR = path.join(ROOT, "dist-standalone");

const TARGETS = [
  "bun-darwin-arm64",
  "bun-darwin-x64",
  "bun-linux-x64",
  "bun-linux-arm64",
] as const;

const TEXT_CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".map": "application/json",
  ".txt": "text/plain",
  ".xml": "application/xml",
  ".webmanifest": "application/manifest+json",
};

const BINARY_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function readMigrations(kind: "sqlite" | "pg"): EmbeddedMigrations {
  const dir = path.join(ROOT, "drizzle", "migrations", kind);
  const journal = fs.readFileSync(path.join(dir, "meta", "_journal.json"), "utf-8");
  const sql: Record<string, string> = {};
  for (const entry of JSON.parse(journal).entries as Array<{ tag: string }>) {
    sql[entry.tag] = fs.readFileSync(path.join(dir, `${entry.tag}.sql`), "utf-8");
  }
  return { journal, sql };
}

function readHubFile(filePath: string): EmbeddedHubFile {
  const ext = path.extname(filePath);
  const textType = TEXT_CONTENT_TYPES[ext];
  if (textType) {
    return { contentType: textType, body: fs.readFileSync(filePath, "utf-8"), encoding: "utf8" };
  }
  return {
    contentType: BINARY_CONTENT_TYPES[ext] ?? "application/octet-stream",
    body: fs.readFileSync(filePath).toString("base64"),
    encoding: "base64",
  };
}

function readHubAssets(): Record<string, EmbeddedHubFile> {
  const dist = path.join(ROOT, "dist");
  for (const required of ["index.html", "favicon.svg"]) {
    if (!fs.existsSync(path.join(dist, required))) {
      throw new Error(`${required} not found in dist/. Run 'bun run build' first.`);
    }
  }
  const files: Record<string, EmbeddedHubFile> = {};
  for (const name of ["index.html", "favicon.svg"]) {
    files[name] = readHubFile(path.join(dist, name));
  }
  const assetsDir = path.join(dist, "assets");
  for (const entry of fs.readdirSync(assetsDir, { recursive: true })) {
    const rel = entry.toString();
    const full = path.join(assetsDir, rel);
    if (!fs.statSync(full).isFile()) continue;
    files[`assets/${rel}`] = readHubFile(full);
  }
  return files;
}

const version = (JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8")) as { version: string }).version;

const assets: EmbeddedAssets = {
  version,
  migrations: { sqlite: readMigrations("sqlite"), pg: readMigrations("pg") },
  hub: readHubAssets(),
};

const embeddedAssetsPlugin: BunPlugin = {
  name: "grapity-embedded-assets",
  setup(build) {
    build.onResolve({ filter: /^grapity-embedded-assets$/ }, () => ({
      path: "grapity-embedded-assets",
      namespace: "embedded",
    }));
    build.onLoad({ filter: /.*/, namespace: "embedded" }, () => ({
      contents: `export const ASSETS = ${JSON.stringify(assets)};`,
      loader: "js",
    }));
  },
};

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const target of TARGETS) {
  const suffix = target.replace(/^bun-/, "");
  const outfile = path.join(OUT_DIR, `grapity-${suffix}`);
  const result = await Bun.build({
    entrypoints: [path.join(ROOT, "src/cli/index.ts")],
    compile: { target, outfile },
    define: { __GRAPITY_VERSION__: JSON.stringify(version) },
    plugins: [embeddedAssetsPlugin],
  });
  if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
  }
  if (suffix.startsWith("darwin") && os.platform() === "darwin") {
    execFileSync("codesign", ["--remove-signature", outfile]);
    execFileSync("codesign", ["--sign", "-", "--force", outfile]);
  }
  const sizeMb = (fs.statSync(outfile).size / 1024 / 1024).toFixed(1);
  console.log(`built ${outfile} (${sizeMb} MB)`);
}
