export interface EmbeddedAssets {
  version: string;
  migrations: {
    sqlite: EmbeddedMigrations;
    pg: EmbeddedMigrations;
  };
  hub: Record<string, EmbeddedHubFile>;
}

export interface EmbeddedMigrations {
  journal: string;
  sql: Record<string, string>;
}

export interface EmbeddedHubFile {
  contentType: string;
  body: string;
  encoding: "utf8" | "base64";
}

export function isStandaloneExecutable(): boolean {
  return (
    typeof Bun !== "undefined" &&
    typeof Bun.main === "string" &&
    Bun.main.startsWith("/$bunfs/")
  );
}

export async function loadEmbeddedAssets(): Promise<EmbeddedAssets | null> {
  if (!isStandaloneExecutable()) return null;
  const mod = await import("grapity-embedded-assets");
  return mod.ASSETS as EmbeddedAssets;
}
