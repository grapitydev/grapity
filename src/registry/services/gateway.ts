import { v4 as uuid } from "uuid";
import yaml from "js-yaml";
import type {
  GatewayConfig,
  GatewayConfigVersion,
  GatewayConfigStore,
  SpecStore,
} from "core";
import { computeChecksum } from "../utils";

export class UnsupportedProviderError extends Error {
  constructor(provider: string) {
    super(`Unsupported provider: "${provider}". Only "kong" is supported.`);
    this.name = "UnsupportedProviderError";
  }
}

export class SpecNotFoundError extends Error {
  constructor(name: string, semver: string) {
    super(`Spec "${name}@${semver}" not found`);
    this.name = "SpecNotFoundError";
  }
}

export class RouteNotFoundError extends Error {
  constructor(path: string, methods: string[]) {
    super(`Route ${methods.join(",")} ${path} not found in spec`);
    this.name = "RouteNotFoundError";
  }
}

export class NoEnvironmentsError extends Error {
  constructor() {
    super("At least one environment must be defined");
    this.name = "NoEnvironmentsError";
  }
}

export class NameExistsError extends Error {
  constructor(name: string) {
    super(`Gateway config "${name}" already exists`);
    this.name = "NameExistsError";
  }
}

const SUPPORTED_PROVIDERS = ["kong"];

export class GatewayService {
  constructor(
    private gatewayStore: GatewayConfigStore,
    private specStore: SpecStore
  ) {}

  async pushGatewayConfig(
    data: {
      name: string;
      provider: string;
      specName: string;
      specSemver: string;
      routes: { path: string; methods: string[] }[];
      environments: Record<string, { kongAddr: string; upstream: string; plugins: { name: string; config: Record<string, unknown>; order?: number }[] }>;
      callerIdentification?: { strategy: "first-match"; rules: { source: string; confidence: "high" | "medium" | "low" | "anonymous" }[] };
      content: string;
      pushedBy?: string;
    }
  ): Promise<{ config: GatewayConfig; version: GatewayConfigVersion }> {
    // 1. Validate provider
    if (!SUPPORTED_PROVIDERS.includes(data.provider)) {
      throw new UnsupportedProviderError(data.provider);
    }

    // 2. Validate spec exists
    const specVersion = await this.specStore.getSpecVersion(data.specName, data.specSemver);
    if (!specVersion) {
      throw new SpecNotFoundError(data.specName, data.specSemver);
    }

    // 3. Validate environments
    const envKeys = Object.keys(data.environments);
    if (envKeys.length === 0) {
      throw new NoEnvironmentsError();
    }

    // 4. Validate routes exist in spec
    const parsedSpec = yaml.load(specVersion.content) as Record<string, unknown> | null;
    const specPaths = (parsedSpec?.paths as Record<string, unknown>) ?? {};

    for (const route of data.routes) {
      const specPathItem = specPaths[route.path] as Record<string, unknown> | undefined;
      if (!specPathItem) {
        throw new RouteNotFoundError(route.path, route.methods);
      }
      for (const method of route.methods) {
        const lowerMethod = method.toLowerCase();
        if (!specPathItem[lowerMethod]) {
          throw new RouteNotFoundError(route.path, [method]);
        }
      }
    }

    // 5. Check name uniqueness for new configs
    const existingConfig = await this.gatewayStore.getGatewayConfig(data.name);

    const config: GatewayConfig = {
      id: existingConfig?.id ?? uuid(),
      name: data.name,
      provider: data.provider as "kong",
      specName: data.specName,
      specSemver: data.specSemver,
      createdAt: existingConfig?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    const environments = envKeys.map((name) => ({
      name,
      ...data.environments[name],
    }));

    const version: GatewayConfigVersion = {
      id: uuid(),
      gatewayConfigId: config.id,
      routes: data.routes,
      environments,
      callerIdentification: data.callerIdentification,
      content: data.content,
      checksum: computeChecksum(data.content),
      pushedBy: data.pushedBy,
      createdAt: new Date(),
    };

    await this.gatewayStore.pushGatewayConfigVersion(config, version);

    return { config, version };
  }

  async listGatewayConfigs(): Promise<GatewayConfig[]> {
    return this.gatewayStore.listGatewayConfigs();
  }

  async getGatewayConfig(name: string): Promise<GatewayConfig | null> {
    return this.gatewayStore.getGatewayConfig(name);
  }

  async listGatewayConfigVersions(name: string): Promise<GatewayConfigVersion[]> {
    return this.gatewayStore.listGatewayConfigVersions(name);
  }

  async getGatewayConfigVersion(name: string, versionId: string): Promise<GatewayConfigVersion | null> {
    return this.gatewayStore.getGatewayConfigVersion(name, versionId);
  }
}
