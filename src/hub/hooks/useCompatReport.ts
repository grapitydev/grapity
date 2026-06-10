import { useState, useEffect } from "react";
import { useApiClient } from "../api/client";
import type { CompatReport } from "core";

export function useCompatReport(name: string, semver: string, enabled = true) {
  const [report, setReport] = useState<CompatReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const client = useApiClient();

  useEffect(() => {
    if (!semver || !enabled) {
      setReport(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    client
      .getCompatReport(name, semver)
      .then(setReport)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [name, semver, enabled]);

  return { report, loading, error };
}
