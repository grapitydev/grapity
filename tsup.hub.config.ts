import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/hub/index.ts", "src/hub/serve.ts", "src/hub/standalone.ts"],
  format: ["esm"],
  outDir: "dist/hub",
  outExtension: () => ({ js: ".js" }),
  dts: true,
  clean: true,
  splitting: false,
});
