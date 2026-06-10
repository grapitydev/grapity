export interface GatewayConfig {
  id: string;
  name: string;
  provider: "kong";
  specName: string;
  specSemver: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GatewayConfigVersion {
  id: string;
  gatewayConfigId: string;
  routes: GatewayRoute[];
  environments: GatewayEnvironment[];
  callerIdentification?: CallerIdentification;
  content: string;
  checksum: string;
  pushedBy?: string;
  createdAt: Date;
}

export interface CallerIdentification {
  strategy: "first-match";
  rules: CallerIdentificationRule[];
}

export interface CallerIdentificationRule {
  source: string;
  confidence: "high" | "medium" | "low" | "anonymous";
}

export interface GatewayRoute {
  path: string;
  methods: string[];
}

export interface GatewayEnvironment {
  name: string;
  kongAddr: string;
  upstream: string;
  plugins: GatewayPlugin[];
}

export interface GatewayPlugin {
  name: string;
  config: Record<string, unknown>;
  order?: number;
}
