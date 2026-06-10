import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/core/index.ts"],
  format: ["esm"],
  outDir: "dist/core",
  outExtension: () => ({ js: ".js" }),
  dts: true,
  clean: true,
  splitting: false,
});
