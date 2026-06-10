import { useState } from "react";
import { useParams } from "react-router-dom";
import { useVersions } from "../hooks/useVersions";
import { useCompareVersions } from "../hooks/useCompareVersions";
import { Select, SelectItem } from "../components/ui/select";
import { Changelog } from "../components/version/Changelog";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { getClassificationPillStyle } from "../lib/classificationStyles";

export function DiffPage() {
  const { name } = useParams<{ name: string }>();
  const { versions, loading: versionsLoading } = useVersions(name!);

  const [versionA, setVersionA] = useState("");
  const [versionB, setVersionB] = useState("");

  const from = versionA && versionB ? (versionA < versionB ? versionA : versionB) : "";
  const to = versionA && versionB ? (versionA < versionB ? versionB : versionA) : "";

  const { result, loading } = useCompareVersions(
    name!,
    from,
    to,
    !!from && !!to
  );

  const versionOptions = versions.map((v) => v.semver);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
          {name} — Compare Versions
        </h1>
        <p className="text-sm text-text-secondary">
          Select two versions to see all incremental changes between them.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            From
          </label>
          <Select
            value={versionA}
            onChange={setVersionA}
            placeholder="Select version A"
          >
            {versionOptions.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            To
          </label>
          <Select
            value={versionB}
            onChange={setVersionB}
            placeholder="Select version B"
          >
            {versionOptions.map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      {(!versionA || !versionB) && (
        <div className="py-12 text-center">
          <p className="text-text-secondary">
            Select two versions to see all incremental changes between them.
          </p>
        </div>
      )}

      {versionA && versionB && loading && (
        <div className="space-y-4">
          <div className="h-8 w-48 rounded bg-surface-hover animate-pulse" />
          <div className="h-32 rounded bg-surface-hover animate-pulse" />
          <div className="h-32 rounded bg-surface-hover animate-pulse" />
        </div>
      )}

      {versionA && versionB && result && (
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
