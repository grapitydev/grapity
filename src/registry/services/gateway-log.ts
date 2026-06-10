import { v4 as uuid } from "uuid";
import type {
  GatewayConfigStore,
  GatewayLog,
  GatewayLogFilters,
  CallerConfidence,
} from "core";

interface KongHttpLogPayload {
  service?: { name?: string };
  route?: { name?: string; paths?: string[] };
  request?: {
    method?: string;
    uri?: string;
    headers?: Record<string, string | string[]>;
  };
  response?: { status?: number };
  consumer?: { id?: string };
  client_ip?: string;
  latencies?: { request?: number };
  started_at?: number;
  tries?: Array<{ ip?: string; port?: number }>;
}

const DEFAULT_CALLER_RULES: { source: string; confidence: CallerConfidence }[] = [
  { source: "kong.consumer.id", confidence: "high" },
  { source: "header.x-consumer-id", confidence: "medium" },
  { source: "header.x-client-id", confidence: "medium" },
  { source: "ip+ua", confidence: "low" },
];

function extractCallerIdentity(
  payload: KongHttpLogPayload,
  rules: { source: string; confidence: CallerConfidence }[]
): { callerId?: string; callerSource?: string; callerConfidence: CallerConfidence } {
  for (const rule of rules) {
    const id = resolveCallerId(payload, rule.source);
    if (id) {
      return { callerId: id, callerSource: rule.source, callerConfidence: rule.confidence };
    }
  }

  return { callerConfidence: "anonymous" };
}

function resolveCallerId(payload: KongHttpLogPayload, source: string): string | undefined {
  if (source === "kong.consumer.id") {
    return payload.consumer?.id;
  }

  if (source.startsWith("header.")) {
    const headerName = source.slice("header.".length);
    const headers = payload.request?.headers ?? {};
    const value = headers[headerName] ?? headers[headerName.toLowerCase()];
    if (value) {
      return Array.isArray(value) ? value[0] : value;
    }
  }

  if (source === "ip+ua") {
    const ip = payload.client_ip ?? payload.tries?.[0]?.ip;
    const ua = payload.request?.headers?.["user-agent"] ?? payload.request?.headers?.["User-Agent"];
    if (ip && ua) {
      return `${ip}::${Array.isArray(ua) ? ua[0] : ua}`;
    }
    if (ip) {
      return ip;
    }
  }

  if (source === "ip") {
    return payload.client_ip ?? payload.tries?.[0]?.ip;
  }

  return undefined;
}

function extractRoutePath(payload: KongHttpLogPayload): string | undefined {
  const routePaths = payload.route?.paths;
  if (routePaths && routePaths.length > 0) {
    return routePaths[0];
  }
  return undefined;
}

export class GatewayLogService {
  constructor(private store: GatewayConfigStore) {}

  async ingestLog(provider: string, environment: string, payload: unknown): Promise<void> {
    const kongPayload = payload as KongHttpLogPayload;
    const gatewayConfigName = kongPayload.service?.name;

    if (!gatewayConfigName) {
      throw new Error("Missing service.name in gateway log payload");
    }

    // Load the latest config version to get caller identification rules
    const configVersion = await this.store.getLatestGatewayConfigVersion(gatewayConfigName);
    const rules = configVersion?.callerIdentification?.rules ?? DEFAULT_CALLER_RULES;

    const caller = extractCallerIdentity(kongPayload, rules);
    const routePath = extractRoutePath(kongPayload);

    const log: GatewayLog = {
      id: uuid(),
      provider,
      gatewayConfigName,
      environment,
      method: kongPayload.request?.method?.toUpperCase() ?? "UNKNOWN",
      path: kongPayload.request?.uri ?? "/",
      routePath,
      status: kongPayload.response?.status ?? 0,
      callerId: caller.callerId,
      callerSource: caller.callerSource,
      callerConfidence: caller.callerConfidence,
      occurredAt: kongPayload.started_at ? new Date(kongPayload.started_at) : new Date(),
      createdAt: new Date(),
    };

    await this.store.recordGatewayLog(log);
  }

  async listLogs(filters: GatewayLogFilters) {
    return this.store.listGatewayLogs(filters);
  }

  async getLog(id: string) {
    return this.store.getGatewayLog(id);
  }

  async getStats(filters: GatewayLogFilters) {
    return this.store.getGatewayLogStats(filters);
  }
}
