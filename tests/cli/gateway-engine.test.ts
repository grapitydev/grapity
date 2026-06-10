import { test, expect, describe } from "bun:test";
import { parseGatewayConfig } from "cli/gateway-engine/parser";
import { generateDeckYaml } from "cli/gateway-engine/generator";
import { buildDeckEnvironment } from "cli/gateway-engine/environment";

describe("parseGatewayConfig", () => {
  test("parses a valid gateway config YAML", () => {
    const yaml = `apiVersion: v1
kind: GatewayConfig

spec:
  name: payments-api-gateway
  provider: kong
  specName: payments-api
  specSemver: "1.2.0"

routes:
  - path: /payments
    methods: [GET, POST]

environments:
  staging:
    kongAddr: http://kong-staging:8001
    upstream: http://payments-staging:8080
    plugins:
      - name: rate-limiting
        config:
          minute: 5000
`;

    const result = parseGatewayConfig(yaml);
    expect(result.name).toBe("payments-api-gateway");
    expect(result.provider).toBe("kong");
    expect(result.specName).toBe("payments-api");
    expect(result.specSemver).toBe("1.2.0");
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0].path).toBe("/payments");
    expect(result.routes[0].methods).toEqual(["GET", "POST"]);
    expect(result.environments.staging).toBeDefined();
    expect(result.environments.staging.kongAddr).toBe("http://kong-staging:8001");
    expect(result.environments.staging.upstream).toBe("http://payments-staging:8080");
    expect(result.environments.staging.plugins).toHaveLength(1);
    expect(result.environments.staging.plugins[0].name).toBe("rate-limiting");
    expect(result.environments.staging.plugins[0].config).toEqual({ minute: 5000 });
  });

  test("parses multiple plugins with order", () => {
    const yaml = `apiVersion: v1
kind: GatewayConfig

spec:
  name: test-gateway
  provider: kong
  specName: test-api
  specSemver: "1.0.0"

routes:
  - path: /test
    methods: [GET]

environments:
  staging:
    kongAddr: http://kong:8001
    upstream: http://test:8080
    plugins:
      - name: rate-limiting
        config:
          minute: 5000
        order: 10
      - name: jwt
        config:
          issuer: "https://auth.example.com"
        order: 20
      - name: http-log
        config:
          http_endpoint: "https://logs.example.com"
`;

    const result = parseGatewayConfig(yaml);
    expect(result.environments.staging.plugins).toHaveLength(3);
    expect(result.environments.staging.plugins[0].name).toBe("rate-limiting");
    expect(result.environments.staging.plugins[0].order).toBe(10);
    expect(result.environments.staging.plugins[1].name).toBe("jwt");
    expect(result.environments.staging.plugins[1].order).toBe(20);
    expect(result.environments.staging.plugins[2].name).toBe("http-log");
    expect(result.environments.staging.plugins[2].order).toBeUndefined();
  });

  test("rejects plugins that are not an array", () => {
    const yaml = `apiVersion: v1
kind: GatewayConfig

spec:
  name: test-gateway
  provider: kong
  specName: test-api
  specSemver: "1.0.0"

routes: []

environments:
  staging:
    kongAddr: http://kong:8001
    upstream: http://test:8080
    plugins:
      name: rate-limiting
`;

    expect(() => parseGatewayConfig(yaml)).toThrow("plugins must be an array");
  });

  test("rejects plugin missing name", () => {
    const yaml = `apiVersion: v1
kind: GatewayConfig

spec:
  name: test-gateway
  provider: kong
  specName: test-api
  specSemver: "1.0.0"

routes: []

environments:
  staging:
    kongAddr: http://kong:8001
    upstream: http://test:8080
    plugins:
      - config:
          minute: 5000
`;

    expect(() => parseGatewayConfig(yaml)).toThrow("plugin name is required");
  });

  test("rejects invalid apiVersion", () => {
    expect(() => parseGatewayConfig("apiVersion: v2\nkind: GatewayConfig\n")).toThrow(
      'expected apiVersion "v1"'
    );
  });

  test("rejects missing spec.name", () => {
    const yaml = `apiVersion: v1
kind: GatewayConfig
spec:
  provider: kong
`;
    expect(() => parseGatewayConfig(yaml)).toThrow("spec.name is required");
  });

  test("rejects missing environments", () => {
    const yaml = `apiVersion: v1
kind: GatewayConfig
spec:
  name: test
  provider: kong
  specName: api
  specSemver: "1.0.0"
routes: []
`;
    expect(() => parseGatewayConfig(yaml)).toThrow("at least one environment");
  });
});

describe("generateDeckYaml", () => {
  test("generates decK YAML for Kong 3.0 format", () => {
    const config = {
      name: "payments-api-gateway",
      provider: "kong" as const,
      specName: "payments-api",
      specSemver: "1.0.0",
      routes: [{ path: "/payments", methods: ["GET", "POST"] }],
      environments: {
        staging: {
          kongAddr: "http://kong:8001",
          upstream: "http://payments:8080",
          plugins: [
            {
              name: "rate-limiting",
              config: { minute: 5000 },
            },
          ],
        },
      },
    };

    const deckYaml = generateDeckYaml(config, "staging");
    expect(deckYaml).toContain("_format_version: '3.0'");
    expect(deckYaml).toContain("name: payments-api-gateway");
    expect(deckYaml).toContain("url: http://payments:8080");
    expect(deckYaml).toContain("paths:");
    expect(deckYaml).toContain("- /payments");
    expect(deckYaml).toContain("methods:");
    expect(deckYaml).toContain("- GET");
    expect(deckYaml).toContain("- POST");
    expect(deckYaml).toContain("name: rate-limiting");
    expect(deckYaml).toContain("minute: 5000");
  });

  test("emits multiple plugins with config and order", () => {
    const config = {
      name: "payments-api-gateway",
      provider: "kong" as const,
      specName: "payments-api",
      specSemver: "1.0.0",
      routes: [{ path: "/payments", methods: ["GET"] }],
      environments: {
        staging: {
          kongAddr: "http://kong:8001",
          upstream: "http://payments:8080",
          plugins: [
            { name: "rate-limiting", config: { minute: 5000 }, order: 10 },
            { name: "jwt", config: { issuer: "https://auth.example.com" }, order: 20 },
            { name: "http-log", config: { http_endpoint: "https://logs.example.com" } },
          ],
        },
      },
    };

    const deckYaml = generateDeckYaml(config, "staging");
    expect(deckYaml).toContain("name: rate-limiting");
    expect(deckYaml).toContain("minute: 5000");
    expect(deckYaml).toContain("order: 10");
    expect(deckYaml).toContain("name: jwt");
    expect(deckYaml).toContain("issuer: https://auth.example.com");
    expect(deckYaml).toContain("order: 20");
    expect(deckYaml).toContain("name: http-log");
    expect(deckYaml).toContain("http_endpoint: https://logs.example.com");
  });

  test("converts path parameters to Kong regex", () => {
    const config = {
      name: "test-gateway",
      provider: "kong" as const,
      specName: "test-api",
      specSemver: "1.0.0",
      routes: [{ path: "/payments/{id}", methods: ["GET"] }],
      environments: {
        staging: {
          kongAddr: "http://kong:8001",
          upstream: "http://payments:8080",
          plugins: [],
        },
      },
    };

    const deckYaml = generateDeckYaml(config, "staging");
    expect(deckYaml).toContain("~/payments/(?<id>[^/]+)");
  });

  test("throws for missing environment", () => {
    const config = {
      name: "test-gateway",
      provider: "kong" as const,
      specName: "test-api",
      specSemver: "1.0.0",
      routes: [],
      environments: {
        staging: {
          kongAddr: "http://kong:8001",
          upstream: "http://payments:8080",
          plugins: [],
        },
      },
    };

    expect(() => generateDeckYaml(config, "prod")).toThrow(
      'Environment "prod" not found'
    );
  });
});

describe("buildDeckEnvironment", () => {
  test("returns DECK_KONG_ADDR from environment", () => {
    const config = {
      name: "test-gateway",
      provider: "kong" as const,
      specName: "test-api",
      specSemver: "1.0.0",
      routes: [],
      environments: {
        staging: {
          kongAddr: "http://kong-staging:8001",
          upstream: "http://payments:8080",
          plugins: [],
        },
      },
    };

    const env = buildDeckEnvironment(config, "staging");
    expect(env.kongAddr).toBe("http://kong-staging:8001");
    expect(env.envVars.DECK_KONG_ADDR).toBe("http://kong-staging:8001");
  });

  test("throws for missing environment", () => {
    const config = {
      name: "test-gateway",
      provider: "kong" as const,
      specName: "test-api",
      specSemver: "1.0.0",
      routes: [],
      environments: {},
    };

    expect(() => buildDeckEnvironment(config, "prod")).toThrow(
      'Environment "prod" not found'
    );
  });
});
