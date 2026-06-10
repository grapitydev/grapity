export type ProvisionAction = "gateway.push" | "gateway.provision";

export interface Provision {
  id: string;
  gatewayConfigName: string;
  gatewayConfigVersion: string;
  environment: string;
  provider: "kong";
  synced: boolean;
  actor: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}
