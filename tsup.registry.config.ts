import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/registry/index.ts", "src/registry/serve.ts"],
  format: ["esm"],
  outDir: "dist/registry",
  outExtension: () => ({ js: ".js" }),
  dts: true,
  clean: true,
  splitting: false,
  external: ["pg"],
});
