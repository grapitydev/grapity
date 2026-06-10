import { useNavigate } from "react-router-dom";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import type { Spec, VersionClassification } from "@grapity/core";
import { getClassificationPillStyle } from "../../lib/classificationStyles";

interface SpecCardProps {
  spec: Spec;
  latestVersion?: { semver: string; classification?: VersionClassification };
}

export function SpecCard({ spec, latestVersion }: SpecCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="cursor-pointer hover:-translate-y-0.5 hover:border-accent-indigo/30 transition-all duration-200"
      onClick={() => navigate(`/specs/${spec.name}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <Badge variant={spec.type === "openapi" ? "green" : spec.type === "asyncapi" ? "rose" : "default"}>{spec.type}</Badge>
        {latestVersion && (
          <span className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-bold ${getClassificationPillStyle(latestVersion.classification)}`}>
            {latestVersion.semver}
          </span>
        )}
      </div>

      <h3 className="font-display font-semibold text-text-primary mb-1">{spec.name}</h3>
      {spec.description && (
        <p className="text-sm text-text-secondary mb-3 line-clamp-2">{spec.description}</p>
      )}

      <div className="space-y-2">
        {spec.owner && (
          <p className="text-xs text-text-secondary">
            Owner: <span className="text-text-primary">{spec.owner}</span>
          </p>
        )}
        {spec.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {spec.tags.map((tag) => (
              <Badge key={tag} variant="default">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
