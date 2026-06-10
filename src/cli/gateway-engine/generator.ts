import yaml from "js-yaml";
import type { ParsedGatewayConfig } from "./parser";

export interface DeckRoute {
  name: string;
  paths: string[];
  methods: string[];
}

export interface DeckPlugin {
  name: string;
  config: Record<string, unknown>;
  order?: number;
}

export interface DeckService {
  name: string;
  url: string;
  routes: DeckRoute[];
  plugins: DeckPlugin[];
}

export interface DeckDocument {
  _format_version: string;
  services: DeckService[];
}

function convertPathToKong(path: string): string {
  const converted = path.replace(/\{([^}]+)\}/g, "(?<$1>[^/]+)");
  // Kong 3.0+ requires ~ prefix for regex paths
  if (converted !== path) {
    return "~" + converted;
  }
  return converted;
}

function routeName(serviceName: string, index: number, path: string, methods: string[]): string {
  const cleanPath = path.replace(/[^a-zA-Z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const methodList = methods.join("-").toLowerCase();
  return `${serviceName}-${cleanPath}-${methodList}-${index}`;
}

export function generateDeckYaml(
  config: ParsedGatewayConfig,
  envName: string
): string {
  const env = config.environments[envName];
  if (!env) {
    throw new Error(`Environment "${envName}" not found in gateway config "${config.name}"`);
  }

  const service: DeckService = {
    name: config.name,
    url: env.upstream,
    routes: config.routes.map((route, i) => ({
      name: routeName(config.name, i, route.path, route.methods),
      paths: [convertPathToKong(route.path)],
      methods: route.methods.map((m) => m.toUpperCase()),
    })),
    plugins: env.plugins.map((p) => ({
      name: p.name,
      config: p.config,
      order: p.order,
    })),
  };

  const doc: DeckDocument = {
    _format_version: "3.0",
    services: [service],
  };

  return yaml.dump(doc, { noRefs: true, sortKeys: false });
}
