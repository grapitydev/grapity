import type {
  PushSpecRequest,
  PushSpecResponse,
  ValidateSpecRequest,
  ValidateSpecResponse,
  ListSpecsResponse,
  GetSpecResponse,
  ListVersionsResponse,
  GetVersionResponse,
  GetCompatReportResponse,
  HealthResponse,
  PushGatewayConfigRequest,
  PushGatewayConfigResponse,
  ListGatewayConfigsResponse,
  GetGatewayConfigResponse,
  ListGatewayConfigVersionsResponse,
  GetGatewayConfigVersionResponse,
  ListGatewayLogsResponse,
  GetGatewayLogStatsResponse,
  GetGatewayLogResponse,
} from "core";
import { getRegistryUrl } from "./config";
import type { CompatReport } from "core";

export class BreakingChangeError extends Error {
  constructor(public readonly compatReport: CompatReport) {
    super("Breaking changes detected");
    this.name = "BreakingChangeError";
  }
}

  async function request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const baseUrl = getRegistryUrl();
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json() as { message?: string; compatReport?: CompatReport };
      if (response.status === 409 && error.compatReport) {
        throw new BreakingChangeError(error.compatReport);
      }
      throw new Error(error.message ?? `Request failed: ${response.status}`);
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as Promise<T>;
  }

async function requestText(method: string, path: string): Promise<{ text: string; headers: Headers }> {
  const baseUrl = getRegistryUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, { method });

  if (!response.ok) {
    const error = await response.json() as { message?: string };
    throw new Error(error.message ?? `Request failed: ${response.status}`);
  }

  return { text: await response.text(), headers: response.headers };
}

export const client = {
  pushSpec: async (data: PushSpecRequest) => {
    const res = await request<PushSpecResponse>("POST", "/v1/specs", data);
    return res.data;
  },

  validateSpec: async (name: string, data: ValidateSpecRequest) => {
    const res = await request<ValidateSpecResponse>("POST", `/v1/specs/${name}/validate`, data);
    return res.data;
  },

  listSpecs: async (params?: { type?: string; owner?: string; tags?: string[] }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.owner) searchParams.set("owner", params.owner);
    if (params?.tags) searchParams.set("tags", params.tags.join(","));
    const query = searchParams.toString();
    const res = await request<ListSpecsResponse>("GET", `/v1/specs${query ? `?${query}` : ""}`);
    return res.data;
  },

  getSpec: async (name: string) => {
    const res = await request<GetSpecResponse>("GET", `/v1/specs/${name}`);
    return res.data;
  },

  listVersions: (name: string, params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
    if (params?.offset !== undefined) searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    return request<ListVersionsResponse>("GET", `/v1/specs/${name}/versions${query ? `?${query}` : ""}`);
  },

  getVersion: async (name: string, semver: string) => {
    const res = await request<GetVersionResponse>("GET", `/v1/specs/${name}/versions/${semver}`);
    return res.data;
  },

  getCompatReport: async (name: string, semver: string) => {
    const res = await request<GetCompatReportResponse>("GET", `/v1/specs/${name}/compat/${semver}`);
    return res.data;
  },

  deleteSpec: async (name: string) => {
    await request("DELETE", `/v1/specs/${name}`);
  },

  health: () => request<HealthResponse>("GET", "/v1/health"),

  fetchSpec: async (name: string, options: { semver?: string; format?: "json" | "yaml" }) => {
    const format = options.format ?? "yaml";
    const path = options.semver
      ? `/v1/specs/${name}/versions/${options.semver}/spec.${format}`
      : `/v1/specs/${name}/spec.${format}`;
    const { text, headers } = await requestText("GET", path);
    return {
      content: text,
      resolvedVersion: headers.get("Grapity-Resolved-Version") ?? undefined,
    };
  },

  pushGatewayConfig: async (data: PushGatewayConfigRequest) => {
    const res = await request<PushGatewayConfigResponse>("POST", "/v1/gateway-configs", data);
    return res.data;
  },

  listGatewayConfigs: async () => {
    const res = await request<ListGatewayConfigsResponse>("GET", "/v1/gateway-configs");
    return res.data;
  },

  getGatewayConfig: async (name: string) => {
    const res = await request<GetGatewayConfigResponse>("GET", `/v1/gateway-configs/${name}`);
    return res.data;
  },

  listGatewayConfigVersions: async (name: string) => {
    const res = await request<ListGatewayConfigVersionsResponse>("GET", `/v1/gateway-configs/${name}/versions`);
    return res.data;
  },

  getGatewayConfigVersion: async (name: string, versionId: string) => {
    const res = await request<GetGatewayConfigVersionResponse>("GET", `/v1/gateway-configs/${name}/versions/${versionId}`);
    return res.data;
  },

  listGatewayLogs: async (params?: {
    gatewayConfig?: string;
    environment?: string;
    path?: string;
    method?: string;
    status?: number;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.gatewayConfig) searchParams.set("gatewayConfig", params.gatewayConfig);
    if (params?.environment) searchParams.set("environment", params.environment);
    if (params?.path) searchParams.set("path", params.path);
    if (params?.method) searchParams.set("method", params.method);
    if (params?.status !== undefined) searchParams.set("status", String(params.status));
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    if (params?.limit !== undefined) searchParams.set("limit", String(params.limit));
    if (params?.offset !== undefined) searchParams.set("offset", String(params.offset));
    const query = searchParams.toString();
    const res = await request<ListGatewayLogsResponse>("GET", `/v1/gateway-logs${query ? `?${query}` : ""}`);
    return res;
  },

  getGatewayLogStats: async (params?: {
    gatewayConfig?: string;
    environment?: string;
    from?: string;
    to?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.gatewayConfig) searchParams.set("gatewayConfig", params.gatewayConfig);
    if (params?.environment) searchParams.set("environment", params.environment);
    if (params?.from) searchParams.set("from", params.from);
    if (params?.to) searchParams.set("to", params.to);
    const query = searchParams.toString();
    const res = await request<GetGatewayLogStatsResponse>("GET", `/v1/gateway-logs/stats${query ? `?${query}` : ""}`);
    return res.data;
  },

  getGatewayLog: async (id: string) => {
    const res = await request<GetGatewayLogResponse>("GET", `/v1/gateway-logs/${id}`);
    return res.data;
  },
};
