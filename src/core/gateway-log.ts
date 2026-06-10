export type CallerConfidence = "high" | "medium" | "low" | "anonymous";

export interface CallerIdentificationRule {
  source: string;
  confidence: CallerConfidence;
}

export interface CallerIdentification {
  strategy: "first-match";
  rules: CallerIdentificationRule[];
}

export interface GatewayLog {
  id: string;
  provider: string;
  gatewayConfigName: string;
  environment: string;
  method: string;
  path: string;
  routePath?: string;
  status: number;
  callerId?: string;
  callerSource?: string;
  callerConfidence: CallerConfidence;
  occurredAt: Date;
  createdAt: Date;
}

export interface GatewayLogStats {
  gatewayConfigName: string;
  environment: string;
  method: string;
  routePath: string;
  lastSeenAt: Date;
  totalCalls: number;
  uniqueCallerIds: number;
}

export interface GatewayLogFilters {
  gatewayConfigName?: string;
  environment?: string;
  path?: string;
  method?: string;
  status?: number;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}
