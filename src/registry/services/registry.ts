import { v4 as uuid } from "uuid";
import type { Spec, SpecVersion, SpecStore, SpecFilters, CompatReport } from "core";
import { computeChecksum } from "../utils";
import { normalizeSpec } from "../utils/normalize-spec";
import { parseOpenApiSpec } from "../parser/openapi/parse";
import { diffSpecs } from "../compat-engine/differ";
import { checkGracePeriod } from "../compat-engine/grace-period";
import { classifyChanges } from "../compat-engine/classify";
import type { VersionClassification } from "core";

export class BreakingChangeError extends Error {
  constructor(public readonly compatReport: CompatReport) {
    super("Breaking changes detected");
    this.name = "BreakingChangeError";
  }
}

export class PrereleaseConstraintError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PrereleaseConstraintError";
  }
}

export class RegistryService {
  constructor(private store: SpecStore) {}

  async pushSpec(
    content: string,
    name: string,
    options?: {
      type?: "openapi" | "asyncapi";
      description?: string;
      owner?: string;
      sourceRepo?: string;
      tags?: string[];
      gitRef?: string;
      pushedBy?: string;
      prerelease?: boolean;
      force?: boolean;
      reason?: string;
    }
  ): Promise<{
    spec: Spec;
    version: SpecVersion;
    compatReport?: CompatReport;
    isNewSpec: boolean;
  }> {
    const prerelease = options?.prerelease ?? false;
    const existingSpec = await this.store.getSpec(name);
    const isNewSpec = !existingSpec;

    const isOpenApi = (options?.type ?? "openapi") === "openapi";
    const normalized = isOpenApi ? normalizeSpec(content) : content;
    const checksum = computeChecksum(normalized);

    let spec: Spec;
    let compatReport: CompatReport | undefined;
    let semver: string;
    let previousVersion: string | undefined;

    if (isNewSpec) {
      spec = {
        id: uuid(),
        name,
        type: options?.type ?? "openapi",
        description: options?.description,
        owner: options?.owner,
        sourceRepo: options?.sourceRepo,
        tags: options?.tags ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      semver = prerelease ? "0.1.0" : "1.0.0";
    } else {
      spec = existingSpec;
      const latestVersion = await this.store.getLatestVersion(name);

      if (prerelease && latestVersion && !latestVersion.isPrerelease) {
        throw new PrereleaseConstraintError(
          `Cannot push pre-release version. ${name}@${latestVersion.semver} is already a release version.`
        );
      }

      if (!latestVersion) {
        semver = prerelease ? "0.1.0" : "1.0.0";
      } else {
        previousVersion = latestVersion.semver;

        const oldSpec = parseOpenApiSpec(latestVersion.content);
        const newSpec = parseOpenApiSpec(normalized);
        const changes = diffSpecs(oldSpec, newSpec);
        const graceViolations = checkGracePeriod(changes);
        const { compatReport: report } = classifyChanges(
          changes,
          graceViolations,
          previousVersion,
        );

        // Sunset-eligible removals (endpoint, param, property) are allowed (auto-major bump).
        // All other breaking changes require force.
        const allowedRules = new Set([
          "endpoint-removed",
          "param-removed",
          "request-body-property-removed",
          "response-property-removed",
        ]);
        const blockedBreakingChanges = report.breakingChanges.filter(
          (b) => !allowedRules.has(b.rule)
        );

        if (!options?.force && blockedBreakingChanges.length > 0) {
          throw new BreakingChangeError(report);
        }

        if (prerelease) {
          const level = report.classification === "patch" ? "patch" : "minor";
          semver = this.bumpPreRelease(latestVersion.semver, level);
        } else if (latestVersion.isPrerelease) {
          semver = "1.0.0";
        } else {
          semver = this.bumpRelease(latestVersion.semver, report.classification);
        }

        compatReport = { ...report, suggestedVersion: semver };
      }
    }

    const version: SpecVersion = {
      id: uuid(),
      specId: spec.id,
      semver,
      content: normalized,
      checksum,
      gitRef: options?.gitRef,
      pushedBy: options?.pushedBy,
      compatibility: compatReport ?? (isNewSpec ? { previousVersion: "0.0.0", classification: "initial", breakingChanges: [], safeChanges: [] } : undefined),
      previousVersion,
      forceReason: options?.force ? options.reason : undefined,
      isPrerelease: prerelease,
      createdAt: new Date(),
    };

    await this.store.pushSpecVersion(spec, version);

    const auditAction = options?.force ? "spec.push.force" : "spec.push";
    await this.store.logAudit(auditAction, options?.pushedBy ?? "unknown", name, semver, {
      breakingChanges: compatReport?.breakingChanges.length ?? 0,
      safeChanges: compatReport?.safeChanges.length ?? 0,
      forced: options?.force ?? false,
      reason: options?.reason,
    });

    return { spec, version, compatReport, isNewSpec };
  }

  async listSpecs(filters?: SpecFilters) {
    const specs = await this.store.listSpecs(filters);
    return Promise.all(
      specs.map(async (spec) => {
        const latestVersion = await this.store.getLatestVersion(spec.name);
        return { ...spec, latestVersion: latestVersion ?? undefined };
      })
    );
  }

  async getSpec(name: string) {
    const spec = await this.store.getSpec(name);
    if (!spec) return null;
    const latestVersion = await this.store.getLatestVersion(name);
    return { spec, latestVersion: latestVersion ?? undefined };
  }

  async listVersions(name: string, options?: { limit?: number; offset?: number }) {
    return this.store.listVersions(name, options);
  }

  async getVersion(name: string, semver: string) {
    return this.store.getSpecVersion(name, semver);
  }

  async getCompatReport(name: string, semver: string) {
    return this.store.getCompatReport(name, semver);
  }

  async compareVersions(name: string, from: string, to: string) {
    const spec = await this.store.getSpec(name);
    if (!spec) return null;

    const all = await this.store.listVersions(name, { limit: 10000, offset: 0 });

    const fromVersion = all.versions.find((v) => v.semver === from);
    const toVersion = all.versions.find((v) => v.semver === to);
    if (!fromVersion || !toVersion) return null;

    const sorted = [...all.versions].sort((a, b) => {
      const aParts = a.semver.split(".").map(Number);
      const bParts = b.semver.split(".").map(Number);
      for (let i = 0; i < 3; i++) {
        if (aParts[i] !== bParts[i]) return aParts[i] - bParts[i];
      }
      return 0;
    });

    const fromIndex = sorted.findIndex((v) => v.semver === from);
    const toIndex = sorted.findIndex((v) => v.semver === to);
    const start = Math.min(fromIndex, toIndex);
    const end = Math.max(fromIndex, toIndex);

    const steps = sorted.slice(start + 1, end + 1).map((v) => {
      const report = v.compatibility;
      if (!report) {
        return {
          version: v.semver,
          previousVersion: v.previousVersion ?? "0.0.0",
          classification: "initial" as VersionClassification,
          breakingChanges: [],
          safeChanges: [],
        };
      }
      return {
        version: v.semver,
        previousVersion: report.previousVersion,
        classification: report.classification,
        breakingChanges: report.breakingChanges,
        safeChanges: report.safeChanges,
      };
    });

    return { from: sorted[start].semver, to: sorted[end].semver, steps };
  }

  async deleteSpec(name: string, actor?: string): Promise<boolean> {
    const deleted = await this.store.deleteSpec(name);
    if (deleted) {
      await this.store.logAudit("spec.delete", actor ?? "unknown", name, undefined, {});
    }
    return deleted;
  }

  private bumpRelease(current: string, classification: VersionClassification | "initial"): string {
    const parts = current.split(".").map(Number);
    if (parts.length !== 3) return "1.0.0";
    const [major, minor, patch] = parts;
    switch (classification) {
      case "major": return `${major + 1}.0.0`;
      case "minor": return `${major}.${minor + 1}.0`;
      case "patch": return `${major}.${minor}.${patch + 1}`;
      default: return `${major}.${minor + 1}.0`;
    }
  }

  private bumpPreRelease(current: string, level: "minor" | "patch"): string {
    const parts = current.split(".").map(Number);
    if (parts.length !== 3) return "0.1.0";
    const [major, minor, patch] = parts;
    switch (level) {
      case "minor": return `${major}.${minor + 1}.0`;
      case "patch": return `${major}.${minor}.${patch + 1}`;
    }
  }
}
