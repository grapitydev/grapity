import type { ParsedGatewayConfig } from "./parser";

export interface DeckEnvironment {
  kongAddr: string;
  envVars: Record<string, string>;
}

export function buildDeckEnvironment(
  config: ParsedGatewayConfig,
  envName: string
): DeckEnvironment {
  const env = config.environments[envName];
  if (!env) {
    throw new Error(`Environment "${envName}" not found in gateway config "${config.name}"`);
  }

  return {
    kongAddr: env.kongAddr,
    envVars: {
      DECK_KONG_ADDR: env.kongAddr,
    },
  };
}
