import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useSpec } from "../hooks/useSpec";
import { useVersion } from "../hooks/useVersion";
import { useVersions } from "../hooks/useVersions";
import { useCompatReport } from "../hooks/useCompatReport";
import { useSpecContent } from "../hooks/useSpecContent";
import { useSpecExplorer } from "../context/SpecExplorerContext";
import { parseOpenAPI } from "../lib/parseOpenAPI";
import { VersionDetail } from "../components/version/VersionDetail";
import { VersionBadge } from "../components/spec/VersionBadge";
import { Badge } from "../components/ui/badge";
import { Tag, User, ExternalLink } from "lucide-react";

export function VersionPage() {
  const { name, semver } = useParams<{ name: string; semver: string }>();
  const { spec } = useSpec(name!);
  const { versions } = useVersions(name!);
  const { version, loading: versionLoading, error: versionError } = useVersion(name!, semver!);
  const { report } = useCompatReport(name!, semver!, !!version?.previousVersion);
  const { content: jsonContent, loading: jsonLoading } = useSpecContent(name!, semver!, "json");
  const { content: yamlContent, loading: yamlLoading } = useSpecContent(name!, semver!, "yaml");
  const { setEndpoints } = useSpecExplorer();

  useEffect(() => {
    if (!jsonLoading && jsonContent) {
      const groups = parseOpenAPI(jsonContent);
      setEndpoints(groups);
    }
  }, [jsonLoading, jsonContent, setEndpoints]);

  useEffect(() => {
    return () => {
      setEndpoints(null);
    };
  }, [setEndpoints]);

  if (versionError) {
    return (
      <div className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-6">
        <p className="text-sm text-accent-rose mb-2">Failed to load version</p>
        <p className="text-xs text-text-secondary">{versionError.message}</p>
      </div>
    );
  }

  if (versionLoading || !version) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 rounded bg-surface-hover animate-pulse" />
        <div className="h-4 w-full rounded bg-surface-hover animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display text-2xl font-bold text-text-primary">{name}</h1>
          {spec && <Badge variant={spec.type === "openapi" ? "green" : spec.type === "asyncapi" ? "rose" : "default"}>{spec.type}</Badge>}
          <VersionBadge
            semver={version.semver}
            classification={version.compatibility?.classification ?? "initial"}
            date={new Date(version.createdAt).toLocaleDateString()}
            isPrerelease={version.isPrerelease}
          />
        </div>
        
        {spec?.description && (
          <p className="text-text-secondary mb-3">{spec.description}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
          {spec?.owner && (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {spec.owner}
            </span>
          )}
          {spec?.sourceRepo && (
            <a
              href={spec.sourceRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Source
            </a>
          )}
          {spec?.tags && spec.tags.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              {spec.tags.join(", ")}
            </span>
          )}
        </div>

        {version.pushedBy && (
          <p className="text-sm text-text-secondary mt-2">
            Pushed by: {version.pushedBy}
          </p>
        )}
        {version.gitRef && (
          <p className="text-xs text-text-muted font-mono mt-1">{version.gitRef}</p>
        )}
      </div>

      <VersionDetail
        version={version}
        compatReport={report}
        name={name!}
        jsonContent={jsonContent}
        yamlContent={yamlContent}
        contentLoading={jsonLoading || yamlLoading}
        jsonLoading={jsonLoading}
        versions={versions}
        specName={name!}
      />
    </div>
  );
}
