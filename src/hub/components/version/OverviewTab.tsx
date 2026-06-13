import { useMemo, useEffect } from "react";
import { EndpointList } from "./EndpointList";
import { OverviewFooter } from "./OverviewFooter";
import { Skeleton } from "../ui/skeleton";
import { useSpecExplorer } from "../../context/SpecExplorerContext";
import { useActiveEndpoint } from "../../hooks/useActiveEndpoint";
import type { PublicSpecVersion } from "core";

interface OverviewTabProps {
  version: PublicSpecVersion;
  jsonContent: string;
  jsonLoading: boolean;
}

export function OverviewTab({ version, jsonLoading }: OverviewTabProps) {
  const { endpoints, setActiveEndpointId, scrollSuppressed } = useSpecExplorer();

  const endpointIds = useMemo(
    () => endpoints?.flatMap((g) => g.endpoints.map((e) => e.id)) ?? [],
    [endpoints]
  );

  const activeId = useActiveEndpoint(endpointIds, scrollSuppressed);

  useEffect(() => {
    setActiveEndpointId(activeId);
  }, [activeId, setActiveEndpointId]);

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="font-display text-base font-semibold text-text-primary">Metadata</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-text-secondary">Spec ID</dt>
            <dd className="font-mono text-sm text-text-primary">{version.specId}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Semver</dt>
            <dd className="font-mono text-sm text-text-primary">{version.semver}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Checksum</dt>
            <dd className="font-mono text-xs text-text-muted break-all">{version.checksum}</dd>
          </div>
          {version.gitRef && (
            <div>
              <dt className="text-xs text-text-secondary">Git Ref</dt>
              <dd className="font-mono text-xs text-text-muted">{version.gitRef}</dd>
            </div>
          )}
          {version.pushedBy && (
            <div>
              <dt className="text-xs text-text-secondary">Pushed By</dt>
              <dd className="text-sm text-text-primary">{version.pushedBy}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-text-secondary">Created</dt>
            <dd className="text-sm text-text-primary">
              {new Date(version.createdAt).toLocaleString()}
            </dd>
          </div>
          {version.previousVersion && (
            <div>
              <dt className="text-xs text-text-secondary">Previous Version</dt>
              <dd className="text-sm text-text-primary">{version.previousVersion}</dd>
            </div>
          )}
          {version.isPrerelease && (
            <div>
              <dt className="text-xs text-text-secondary">Prerelease</dt>
              <dd className="text-sm text-accent-amber">Yes</dd>
            </div>
          )}
          {version.forceReason && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-text-secondary">Force Reason</dt>
              <dd className="text-sm text-accent-amber">{version.forceReason}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-base font-semibold text-text-primary">Endpoints</h3>
        {jsonLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : endpoints && endpoints.length > 0 ? (
          <EndpointList groups={endpoints} />
        ) : (
          <p className="text-sm text-text-secondary">
            No endpoints found in this spec.
          </p>
        )}
        <OverviewFooter />
      </div>
    </div>
  );
}
