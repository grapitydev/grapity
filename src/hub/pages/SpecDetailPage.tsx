import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSpec } from "../hooks/useSpec";

export function SpecDetailPage() {
  const { name } = useParams<{ name: string }>();
  const { latestVersion, loading, error } = useSpec(name!);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) return;
    if (!loading && latestVersion) {
      navigate(`/specs/${name}/versions/${latestVersion.semver}`, { replace: true });
    }
  }, [loading, latestVersion, error, name, navigate]);

  if (error) {
    return (
      <div className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-6">
        <p className="text-sm text-accent-rose mb-2">Failed to load spec</p>
        <p className="text-xs text-text-secondary">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-surface-hover animate-pulse" />
      <div className="h-4 w-full rounded bg-surface-hover animate-pulse" />
    </div>
  );
}
