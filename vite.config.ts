import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
  },
  server: {
    port: 5173,
    proxy: {
      "/v1": {
        target: "http://localhost:3750",
        changeOrigin: true,
      },
    },
  },
});
