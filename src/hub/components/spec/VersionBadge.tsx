import type { VersionClassification } from "@grapity/core";
import { getClassificationPillStyle } from "../../lib/classificationStyles";

interface VersionBadgeProps {
  semver: string;
  classification: VersionClassification;
  date: string;
  isPrerelease?: boolean;
}

export function VersionBadge({ semver, classification, date, isPrerelease }: VersionBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-bold ${getClassificationPillStyle(classification)}`}
      >
        {semver}
      </span>
      <span className="text-xs text-text-secondary">{classification}</span>
      {isPrerelease && (
        <span className="rounded-sm bg-accent-amber/10 px-1.5 py-0.5 text-xs text-accent-amber">
          prerelease
        </span>
      )}
      <span className="text-xs text-text-muted ml-auto">{date}</span>
    </div>
  );
}
