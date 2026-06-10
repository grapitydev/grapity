import { useNavigate } from "react-router-dom";
import { VersionBadge } from "../spec/VersionBadge";
import type { PublicSpecVersion } from "@grapity/core";

interface VersionsTabProps {
  versions: PublicSpecVersion[];
  specName: string;
  currentSemver: string;
}

export function VersionsTab({ versions, specName, currentSemver }: VersionsTabProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h3 className="font-display text-base font-semibold text-text-primary">
        Version History
      </h3>
      <div className="relative pl-4">
        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-surface-border" />
        <div className="space-y-4">
          {versions.map((version) => {
            const isCurrent = version.semver === currentSemver;
            return (
              <div
                key={version.id}
                className={`relative cursor-pointer rounded-sm p-2 transition-colors ${
                  isCurrent ? "bg-accent-indigo/5 border border-accent-indigo/20" : "hover:bg-surface-hover"
                }`}
                onClick={() => navigate(`/specs/${specName}/versions/${version.semver}`, { replace: true })}
              >
                <div className={`absolute -left-2.5 top-3.5 h-2 w-2 rounded-full border-2 border-surface-base ${
                  isCurrent ? "bg-accent-indigo" : "bg-surface-border"
                }`} />
                <VersionBadge
                  semver={version.semver}
                  classification={version.compatibility?.classification ?? "initial"}
                  date={new Date(version.createdAt).toLocaleDateString()}
                  isPrerelease={version.isPrerelease}
                />
                {isCurrent && (
                  <span className="ml-2 text-xs text-accent-indigo font-medium">current</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
