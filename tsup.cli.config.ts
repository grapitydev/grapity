import { defineConfig } from "tsup";
import path from "node:path";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  outDir: "dist/cli",
  outExtension: () => ({ js: ".js" }),
  dts: true,
  clean: true,
  splitting: false,
  external: ["grapity-embedded-assets"],
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      "sqlite-driver": path.resolve("src/registry/storage/sqlite-driver.node.ts"),
    };
  },
});
