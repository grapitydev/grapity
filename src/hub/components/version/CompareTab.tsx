import { useState } from "react";
import { useCompareVersions } from "../../hooks/useCompareVersions";
import { Select, SelectItem } from "../ui/select";
import { Changelog } from "./Changelog";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { getClassificationPillStyle } from "../../lib/classificationStyles";
import type { PublicSpecVersion } from "@grapity/core";

interface CompareTabProps {
  versions: PublicSpecVersion[];
  specName: string;
  currentSemver: string;
}

function compareSemver(a: string, b: string): number {
  const aParts = a.split(".").map(Number);
  const bParts = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (aParts[i] !== bParts[i]) return aParts[i] - bParts[i];
  }
  return 0;
}

function isOlder(semver: string, current: string): boolean {
  return compareSemver(semver, current) < 0;
}

export function CompareTab({ versions, specName, currentSemver }: CompareTabProps) {
  const [compareVersion, setCompareVersion] = useState("");

  const { result, loading } = useCompareVersions(
    specName,
    compareVersion,
    currentSemver,
    !!compareVersion
  );

  const olderVersions = versions.filter((v) => isOlder(v.semver, currentSemver));

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          Compare with
        </label>
        <Select
          value={compareVersion}
          onChange={setCompareVersion}
          placeholder="Select a version to compare"
        >
          {olderVersions.map((v) => (
            <SelectItem key={v.semver} value={v.semver}>
              {v.semver}
            </SelectItem>
          ))}
        </Select>
      </div>

      {!compareVersion && (
        <div className="py-12 text-center">
          <p className="text-text-secondary">
            Select an older version to see all incremental changes up to {currentSemver}.
          </p>
        </div>
      )}

      {compareVersion && loading && (
        <div className="space-y-4">
          <div className="h-8 w-48 rounded bg-surface-hover animate-pulse" />
          <div className="h-32 rounded bg-surface-hover animate-pulse" />
          <div className="h-32 rounded bg-surface-hover animate-pulse" />
        </div>
      )}

      {compareVersion && result && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Changes from {result.from} to {result.to}
            </h2>
            <Badge variant="default">{result.steps.length} steps</Badge>
          </div>

          {result.steps.length === 0 && (
            <p className="text-sm text-text-secondary">No intermediate versions. The selected versions are the same.</p>
          )}

          {result.steps.map((step) => (
            <Card key={step.version}>
              <div className="mb-4 border-b border-surface-border pb-3 flex items-center gap-3">
                <h3 className="font-display text-base font-semibold text-text-primary">
                  {step.version}
                </h3>
                <span className={getClassificationPillStyle(step.classification)}>
                  {step.classification}
                </span>
                <span className="text-xs text-text-muted">
                  from {step.previousVersion}
                </span>
              </div>
              <Changelog
                report={{
                  previousVersion: step.previousVersion,
                  classification: step.classification,
                  breakingChanges: step.breakingChanges,
                  safeChanges: step.safeChanges,
                }}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
