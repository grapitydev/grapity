import type { GatewayConfig, GatewayConfigVersion } from "./gateway-config";
import type { Provision } from "./provision";
import type { GatewayLog, GatewayLogFilters, GatewayLogStats } from "./gateway-log";

export interface GatewayConfigStore {
  getGatewayConfig(name: string): Promise<GatewayConfig | null>;
  listGatewayConfigs(): Promise<GatewayConfig[]>;
  getGatewayConfigVersion(
    name: string,
    versionId: string
  ): Promise<GatewayConfigVersion | null>;
  getLatestGatewayConfigVersion(name: string): Promise<GatewayConfigVersion | null>;
  listGatewayConfigVersions(name: string): Promise<GatewayConfigVersion[]>;
  pushGatewayConfigVersion(
    config: GatewayConfig,
    version: GatewayConfigVersion
  ): Promise<GatewayConfigVersion>;
  recordProvision(provision: Provision): Promise<void>;
  listProvisions(gatewayConfigName?: string): Promise<Provision[]>;
  recordGatewayLog(log: GatewayLog): Promise<void>;
  listGatewayLogs(filters: GatewayLogFilters): Promise<{ logs: GatewayLog[]; total: number }>;
  getGatewayLog(id: string): Promise<GatewayLog | null>;
  getGatewayLogStats(filters: GatewayLogFilters): Promise<GatewayLogStats[]>;
  deleteGatewayLogsOlderThan(days: number): Promise<void>;
}
