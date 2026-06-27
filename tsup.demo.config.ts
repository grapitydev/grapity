import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/demo/entrypoint.ts"],
  format: ["esm"],
  outDir: "dist/demo",
  outExtension: () => ({ js: ".js" }),
  dts: false,
  clean: true,
  splitting: false,
});
