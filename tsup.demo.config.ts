import { defineConfig } from "tsup";
import path from "node:path";

export default defineConfig({
  entry: ["src/demo/entrypoint.ts"],
  format: ["esm"],
  outDir: "dist/demo",
  outExtension: () => ({ js: ".js" }),
  dts: false,
  clean: true,
  splitting: false,
  external: ["grapity-embedded-assets"],
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      "sqlite-driver": path.resolve("src/registry/storage/sqlite-driver.node.ts"),
    };
  },
});
