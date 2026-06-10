export type VersionClassification = "initial" | "major" | "minor" | "patch";

export interface CompatReport {
  previousVersion: string;
  classification: VersionClassification;
  breakingChanges: BreakingChange[];
  safeChanges: SafeChange[];
  suggestedVersion?: string;
}

export interface BreakingChange {
  id: string;
  rule: string;
  description: string;
  path: string;
  category: "structural" | "documentation";
  originalValue?: string;
  newValue?: string;
  affectedConsumers?: string[];
}

export interface SafeChange {
  id: string;
  rule: string;
  description: string;
  path: string;
  category: "structural" | "documentation";
}