#!/usr/bin/env bash
# Smoke test for a standalone grapity binary: version, init, serve,
# registry push/fetch over HTTP, Hub assets, SPA fallback, 404s.
# Usage: scripts/smoke-standalone.sh <binary-path> [expected-version]
set -euo pipefail

BINARY="${1:?usage: smoke-standalone.sh <binary-path> [expected-version]}"
EXPECTED_VERSION="${2:-}"

need() { command -v "$1" >/dev/null || { echo "missing dependency: $1" >&2; exit 1; }; }
need curl

BINARY="$(cd "$(dirname "$BINARY")" && pwd)/$(basename "$BINARY")"
[ -x "$BINARY" ] || { echo "binary not found or not executable: $BINARY" >&2; exit 1; }

REGISTRY_PORT=3777
HUB_PORT=3778
REGISTRY_URL="http://localhost:$REGISTRY_PORT"
HUB_URL="http://localhost:$HUB_PORT"

SMOKE_HOME="$(mktemp -d)"
SERVER_PID=""
cleanup() {
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  rm -rf "$SMOKE_HOME"
}
trap cleanup EXIT

VERSION_OUT="$(HOME="$SMOKE_HOME" "$BINARY" --version)"
echo "version: $VERSION_OUT"
if [ -n "$EXPECTED_VERSION" ] && [ "$VERSION_OUT" != "$EXPECTED_VERSION" ]; then
  echo "FAIL: expected version $EXPECTED_VERSION, got $VERSION_OUT" >&2
  exit 1
fi

HOME="$SMOKE_HOME" "$BINARY" init --local --port "$REGISTRY_PORT" >/dev/null
echo "init: ok"

HOME="$SMOKE_HOME" "$BINARY" serve --no-auth --port "$REGISTRY_PORT" --hub-port "$HUB_PORT" >"$SMOKE_HOME/serve.log" 2>&1 &
SERVER_PID=$!

for i in $(seq 1 30); do
  if curl -fsS "$REGISTRY_URL/v1/health" >/dev/null 2>&1; then break; fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "server exited during startup; log:" >&2
    cat "$SMOKE_HOME/serve.log" >&2
    exit 1
  fi
  if [ "$i" = 30 ]; then
    echo "server did not become healthy in time; log:" >&2
    cat "$SMOKE_HOME/serve.log" >&2
    exit 1
  fi
  sleep 1
done
echo "health: ok"

PUSH_CODE=$(curl -sS -o /dev/null -w "%{http_code}" -X POST "$REGISTRY_URL/v1/specs" \
  -H 'Content-Type: application/json' \
  -d '{"name":"smoke-api","content":"{\"openapi\":\"3.1.0\",\"info\":{\"title\":\"Smoke\",\"version\":\"1.0.0\"},\"paths\":{\"/ping\":{\"get\":{\"responses\":{\"200\":{\"description\":\"ok\"}}}}}}"}')
[ "$PUSH_CODE" = "201" ] || { echo "FAIL: push returned $PUSH_CODE" >&2; exit 1; }
echo "push: ok"

curl -fsS "$REGISTRY_URL/v1/specs/smoke-api" | grep -q '"name":"smoke-api"' || { echo "FAIL: get spec" >&2; exit 1; }
echo "get: ok"

INDEX_HTML="$(curl -fsS "$HUB_URL/")"
echo "$INDEX_HTML" | grep -q "config.js" || { echo "FAIL: hub index missing config.js injection" >&2; exit 1; }
echo "hub index: ok"

ASSET_PATH="$(echo "$INDEX_HTML" | grep -o '/assets/[^"]*\.js' | head -1)"
[ -n "$ASSET_PATH" ] || { echo "FAIL: no hub asset found in index.html" >&2; exit 1; }
ASSET_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$HUB_URL$ASSET_PATH")
[ "$ASSET_CODE" = "200" ] || { echo "FAIL: hub asset $ASSET_PATH returned $ASSET_CODE" >&2; exit 1; }
echo "hub asset: ok ($ASSET_PATH)"

curl -fsS "$HUB_URL/config.js" | grep -q "__GRAPITY_CONFIG__" || { echo "FAIL: /config.js" >&2; exit 1; }
echo "config.js: ok"

SPA_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$HUB_URL/specs/smoke-api")
[ "$SPA_CODE" = "200" ] || { echo "FAIL: SPA fallback returned $SPA_CODE" >&2; exit 1; }
echo "spa fallback: ok"

MISSING_CODE=$(curl -sS -o /dev/null -w "%{http_code}" "$HUB_URL/assets/definitely-missing.js")
[ "$MISSING_CODE" = "404" ] || { echo "FAIL: missing asset returned $MISSING_CODE, expected 404" >&2; exit 1; }
echo "missing asset 404: ok"

echo "smoke OK: $BINARY"
