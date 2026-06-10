import yaml from "js-yaml";

export interface CallerIdentificationRule {
  source: string;
  confidence: "high" | "medium" | "low" | "anonymous";
}

export interface CallerIdentification {
  strategy: "first-match";
  rules: CallerIdentificationRule[];
}

export interface ParsedGatewayConfig {
  name: string;
  provider: string;
  specName: string;
  specSemver: string;
  routes: { path: string; methods: string[] }[];
  environments: Record<string, {
    kongAddr: string;
    upstream: string;
    plugins: { name: string; config: Record<string, unknown>; order?: number }[];
  }>;
  callerIdentification?: CallerIdentification;
}

export function parseGatewayConfig(content: string): ParsedGatewayConfig {
  const parsed = yaml.load(content);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid gateway config: expected YAML object");
  }

  const doc = parsed as Record<string, unknown>;

  if (doc.apiVersion !== "v1" || doc.kind !== "GatewayConfig") {
    throw new Error('Invalid gateway config: expected apiVersion "v1" and kind "GatewayConfig"');
  }

  const spec = doc.spec as Record<string, unknown> | undefined;
  if (!spec) {
    throw new Error("Invalid gateway config: missing spec section");
  }

  const name = spec.name as string | undefined;
  const provider = spec.provider as string | undefined;
  const specName = spec.specName as string | undefined;
  const specSemver = spec.specSemver as string | undefined;

  if (!name || typeof name !== "string") {
    throw new Error("Invalid gateway config: spec.name is required");
  }
  if (!provider || typeof provider !== "string") {
    throw new Error("Invalid gateway config: spec.provider is required");
  }
  if (!specName || typeof specName !== "string") {
    throw new Error("Invalid gateway config: spec.specName is required");
  }
  if (!specSemver || typeof specSemver !== "string") {
    throw new Error("Invalid gateway config: spec.specSemver is required");
  }

  const routesRaw = doc.routes as unknown[] | undefined;
  if (!routesRaw || !Array.isArray(routesRaw)) {
    throw new Error("Invalid gateway config: routes must be an array");
  }

  const routes = routesRaw.map((r, i) => {
    const route = r as Record<string, unknown>;
    const path = route.path as string | undefined;
    const methods = route.methods as string[] | undefined;

    if (!path || typeof path !== "string") {
      throw new Error(`Invalid gateway config: routes[${i}].path is required`);
    }
    if (!methods || !Array.isArray(methods) || methods.some((m) => typeof m !== "string")) {
      throw new Error(`Invalid gateway config: routes[${i}].methods must be an array of strings`);
    }

    return { path, methods };
  });

  const envsRaw = doc.environments as Record<string, unknown> | undefined;
  if (!envsRaw || typeof envsRaw !== "object" || Object.keys(envsRaw).length === 0) {
    throw new Error("Invalid gateway config: at least one environment must be defined");
  }

  const environments: ParsedGatewayConfig["environments"] = {};

  for (const [envName, envRaw] of Object.entries(envsRaw)) {
    const env = envRaw as Record<string, unknown>;
    const kongAddr = env.kongAddr as string | undefined;
    const upstream = env.upstream as string | undefined;
    const pluginsRaw = env.plugins as unknown[] | undefined;

    if (!kongAddr || typeof kongAddr !== "string") {
      throw new Error(`Invalid gateway config: environments.${envName}.kongAddr is required`);
    }
    if (!upstream || typeof upstream !== "string") {
      throw new Error(`Invalid gateway config: environments.${envName}.upstream is required`);
    }

    const plugins: { name: string; config: Record<string, unknown>; order?: number }[] = [];

    if (pluginsRaw) {
      if (!Array.isArray(pluginsRaw)) {
        throw new Error(`Invalid gateway config: environments.${envName}.plugins must be an array`);
      }
      for (const p of pluginsRaw) {
        const plugin = p as Record<string, unknown>;
        const pluginName = plugin.name as string | undefined;
        const config = (plugin.config as Record<string, unknown>) ?? {};
        const order = plugin.order as number | undefined;

        if (!pluginName || typeof pluginName !== "string") {
          throw new Error(`Invalid gateway config: plugin name is required in environment ${envName}`);
        }

        plugins.push({ name: pluginName, config, order });
      }
    }

    environments[envName] = { kongAddr, upstream, plugins };
  }

  const callerIdRaw = doc.callerIdentification as Record<string, unknown> | undefined;
  let callerIdentification: CallerIdentification | undefined;

  if (callerIdRaw) {
    const strategy = callerIdRaw.strategy as string | undefined;
    const rulesRaw = callerIdRaw.rules as unknown[] | undefined;

    if (strategy !== "first-match") {
      throw new Error('Invalid gateway config: callerIdentification.strategy must be "first-match"');
    }
    if (!rulesRaw || !Array.isArray(rulesRaw)) {
      throw new Error("Invalid gateway config: callerIdentification.rules must be an array");
    }

    const rules: CallerIdentificationRule[] = [];
    for (const r of rulesRaw) {
      const rule = r as Record<string, unknown>;
      const source = rule.source as string | undefined;
      const confidence = rule.confidence as string | undefined;

      if (!source || typeof source !== "string") {
        throw new Error("Invalid gateway config: callerIdentification rule source is required");
      }
      if (!confidence || !["high", "medium", "low", "anonymous"].includes(confidence)) {
        throw new Error("Invalid gateway config: callerIdentification rule confidence must be high, medium, low, or anonymous");
      }

      rules.push({ source, confidence: confidence as "high" | "medium" | "low" | "anonymous" });
    }

    callerIdentification = { strategy, rules };
  }

  return { name, provider, specName, specSemver, routes, environments, callerIdentification };
}
