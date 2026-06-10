import type { CompatReport } from "./compat-report";

export interface SpecVersion {
  id: string;
  specId: string;
  semver: string;
  content: string;
  checksum: string;
  gitRef?: string;
  pushedBy?: string;
  compatibility?: CompatReport;
  previousVersion?: string;
  forceReason?: string;
  isPrerelease: boolean;
  createdAt: Date;
}