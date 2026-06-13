import "@testcontainers/postgresql";

// Preload testcontainers so its ssh2 WASM crypto module is loaded once before
// tests run concurrently. Without this warmup, multiple integration test files
// starting containers in parallel can trigger a WASM parse race in Bun.
