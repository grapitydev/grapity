import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEmbeddedAssets } from "runtime";

export type MigrationsKind = "sqlite" | "pg";

const extractedFolders = new Map<MigrationsKind, string>();

export async function getMigrationsFolder(kind: MigrationsKind): Promise<string> {
  const assets = await loadEmbeddedAssets();
  if (!assets) {
    return new URL(`../../drizzle/migrations/${kind}`, import.meta.url).pathname;
  }

  const cached = extractedFolders.get(kind);
  if (cached) return cached;

  const embedded = assets.migrations[kind];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `grapity-migrations-${kind}-`));
  fs.mkdirSync(path.join(dir, "meta"), { recursive: true });
  fs.writeFileSync(path.join(dir, "meta", "_journal.json"), embedded.journal);
  for (const [tag, sql] of Object.entries(embedded.sql)) {
    fs.writeFileSync(path.join(dir, `${tag}.sql`), sql);
  }
  extractedFolders.set(kind, dir);
  return dir;
}
