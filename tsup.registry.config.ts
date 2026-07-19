import { defineConfig } from "tsup";
import path from "node:path";

export default defineConfig({
  entry: ["src/registry/index.ts", "src/registry/serve.ts", "src/registry/standalone.ts"],
  format: ["esm"],
  outDir: "dist/registry",
  outExtension: () => ({ js: ".js" }),
  dts: true,
  clean: true,
  splitting: true,
  external: ["pg", "grapity-embedded-assets"],
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      "sqlite-driver": path.resolve("src/registry/storage/sqlite-driver.node.ts"),
    };
  },
});
