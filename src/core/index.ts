import type { Spec, SpecType } from "./spec";
import type { SpecVersion } from "./spec-version";
import type {
  CompatReport,
  BreakingChange,
  SafeChange,
  VersionClassification,
} from "./compat-report";
import type { SpecStore, SpecFilters, AuditAction } from "./spec-store";
import type {
  GatewayConfig,
  GatewayConfigVersion,
  GatewayRoute,
  GatewayEnvironment,
  GatewayPlugin,
  CallerIdentification,
  CallerIdentificationRule,
} from "./gateway-config";
import type { GatewayConfigStore } from "./gateway-config-store";
import type { Provision, ProvisionAction } from "./provision";
import type {
  GatewayLog,
  GatewayLogStats,
  GatewayLogFilters,
  CallerConfidence,
  CallerIdentification as LogCallerIdentification,
  CallerIdentificationRule as LogCallerIdentificationRule,
} from "./gateway-log";

// Re-export domain types
export type { Spec, SpecType } from "./spec";
export type { SpecVersion } from "./spec-version";
export type {
  CompatReport,
  BreakingChange,
  SafeChange,
  VersionClassification,
} from "./compat-report";
export type { SpecStore, SpecFilters, AuditAction } from "./spec-store";
export type {
  GatewayConfig,
  GatewayConfigVersion,
  GatewayRoute,
  GatewayEnvironment,
  GatewayPlugin,
  CallerIdentification,
  CallerIdentificationRule,
} from "./gateway-config";
export type { GatewayConfigStore } from "./gateway-config-store";
export type { Provision, ProvisionAction } from "./provision";
export type {
  GatewayLog,
  GatewayLogStats,
  GatewayLogFilters,
  CallerConfidence,
  CallerIdentification as LogCallerIdentification,
  CallerIdentificationRule as LogCallerIdentificationRule,
} from "./gateway-log";

// Generated API types from openapi.yaml — these use string for dates (correct for JSON boundaries)
export type { paths, operations, components } from "./generated/api";

// Convenience aliases
export type PublicSpecVersion = Omit<SpecVersion, "content">;
export type PublicGatewayConfigVersion = Omit<GatewayConfigVersion, "content">;

export interface PaginationMeta {
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  actor: string;
  specName: string;
  version?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

// Re-export generated schema types for backward compatibility
import type { components } from "./generated/api";
export type PushSpecRequest = components["schemas"]["PushSpecRequest"];
export type PushSpecResponse = components["schemas"]["PushSpecResponse"];
export type ValidateSpecRequest = components["schemas"]["ValidateSpecRequest"];
export type ValidateSpecResponse = components["schemas"]["ValidateSpecResponse"];
export type ListSpecsResponse = components["schemas"]["ListSpecsResponse"];
export type GetSpecResponse = components["schemas"]["GetSpecResponse"];
export type ListVersionsResponse = components["schemas"]["VersionsPage"];
export type GetVersionResponse = components["schemas"]["GetVersionResponse"];
export type GetCompatReportResponse = components["schemas"]["GetCompatReportResponse"];
export type CompareVersionsResponse = components["schemas"]["CompareVersionsResponse"];
export type HealthResponse = components["schemas"]["HealthResponse"];
export type SpecListItem = components["schemas"]["SpecListItem"];
export type ApiError = components["schemas"]["ApiError"];
export type BreakingChangeError = components["schemas"]["BreakingChangeError"];

export type PushGatewayConfigRequest = components["schemas"]["PushGatewayConfigRequest"];
export type PushGatewayConfigResponse = components["schemas"]["PushGatewayConfigResponse"];
export type ListGatewayConfigsResponse = components["schemas"]["ListGatewayConfigsResponse"];
export type GetGatewayConfigResponse = components["schemas"]["GetGatewayConfigResponse"];
export type ListGatewayConfigVersionsResponse = components["schemas"]["ListGatewayConfigVersionsResponse"];
export type GetGatewayConfigVersionResponse = components["schemas"]["GetGatewayConfigVersionResponse"];
export type ListGatewayLogsResponse = components["schemas"]["ListGatewayLogsResponse"];
export type GetGatewayLogStatsResponse = components["schemas"]["GetGatewayLogStatsResponse"];
export type GetGatewayLogResponse = components["schemas"]["GetGatewayLogResponse"];
export type GatewayLogStatEntry = components["schemas"]["GatewayLogStatEntry"];
