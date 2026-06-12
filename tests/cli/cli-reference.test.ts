import { test, expect, describe } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dir, "../..");
const commandsDir = path.join(repoRoot, "src/cli/commands");
const docsDir = path.join(repoRoot, "../grapity.dev/docs/cli-reference");

interface CommandEntry {
  filePath: string;
  docPath: string;
  commandName: string;
  flags: string[];
}

function findSourceFiles(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findSourceFiles(full));
    } else if (entry.name.endsWith(".ts") && entry.name !== "index.ts") {
      result.push(full);
    }
  }
  return result;
}

function extractLongFlags(declaration: string): string[] {
  const matches = declaration.matchAll(/--[a-z][a-z0-9-]*/g);
  return Array.from(matches).map((m) => m[0]);
}

function sourceFlags(filePath: string): string[] {
  const content = readFileSync(filePath, "utf-8");
  const flags = new Set<string>();
  for (const match of content.matchAll(/\.(?:requiredOption|option)\(\s*"([^"]+)"/g)) {
    for (const flag of extractLongFlags(match[1])) {
      flags.add(flag);
    }
  }
  return Array.from(flags).sort();
}

function resolveDocMapping(filePath: string): { docPath: string; commandName: string } | null {
  const content = readFileSync(filePath, "utf-8");
  const match = content.match(/CLI REFERENCE:\s*(grapity\.dev\/docs\/cli-reference\/[^\s]+)/);
  if (!match) return null;

  const reference = match[1];
  const relativeDoc = reference.replace("grapity.dev/docs/cli-reference/", "");
  const [docFile, anchor] = relativeDoc.split("#");
  const docPath = path.join(docsDir, docFile);

  let commandName: string;
  if (anchor) {
    commandName = anchor.replace(/^grapity-/, "").replace(/-/g, " ");
  } else {
    commandName = path.basename(docFile, ".md");
  }

  return { docPath, commandName };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function docFlags(docPath: string, commandName: string): string[] {
  const content = readFileSync(docPath, "utf-8");
  const headingRe = new RegExp(
    "^#{1,3}\\s+grapity\\s+" + escapeRegExp(commandName) + "\\b",
    "m"
  );
  const headingMatch = content.match(headingRe);
  if (!headingMatch) return [];

  const level = headingMatch[0].match(/^#+/)![0].length;
  const afterHeading = content.slice(headingMatch.index! + headingMatch[0].length);
  const nextHeading = afterHeading.search(new RegExp(`^#{1,${level}}\\s`, "m"));
  const section = nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading);

  const flags = new Set<string>();
  const flagRe = /`(-[-a-z0-9]+)/g;
  for (const match of section.matchAll(flagRe)) {
    flags.add(match[1]);
  }

  const proseRe = /(?:^|\s)(--[a-z][a-z0-9-]*)/g;
  for (const match of section.matchAll(proseRe)) {
    flags.add(match[1]);
  }

  return Array.from(flags).sort();
}

function buildIndex(): CommandEntry[] {
  const entries: CommandEntry[] = [];
  for (const filePath of findSourceFiles(commandsDir)) {
    const mapping = resolveDocMapping(filePath);
    if (!mapping) continue;
    entries.push({
      filePath,
      docPath: mapping.docPath,
      commandName: mapping.commandName,
      flags: sourceFlags(filePath),
    });
  }
  return entries;
}

describe("CLI reference docs stay in sync with source flags", () => {
  const index = buildIndex();

  test("at least one CLI command has a CLI REFERENCE comment", () => {
    expect(index.length).toBeGreaterThan(0);
  });

  for (const entry of index) {
    const relSource = path.relative(repoRoot, entry.filePath);
    const relDoc = path.relative(repoRoot, entry.docPath);

    describe(`${relSource} → ${relDoc} (${entry.commandName})`, () => {
      test("doc file exists", () => {
        expect(() => readFileSync(entry.docPath, "utf-8")).not.toThrow();
      });

      test("every source flag appears in the doc", () => {
        const documented = docFlags(entry.docPath, entry.commandName);
        for (const flag of entry.flags) {
          expect(documented).toContain(flag);
        }
      });
    });
  }
});
