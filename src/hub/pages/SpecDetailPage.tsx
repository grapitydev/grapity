import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSpec } from "../hooks/useSpec";
import { ErrorState } from "../components/feedback/ErrorState";

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
    return <ErrorState title="Failed to load spec" message={error.message} />;
  }

  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-surface-hover animate-pulse" />
      <div className="h-4 w-full rounded bg-surface-hover animate-pulse" />
    </div>
  );
}
