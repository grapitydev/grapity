import { useState, useEffect } from "react";
import { useApiClient } from "../api/client";
import type { CompareVersionsResponse } from "core";

export function useCompareVersions(name: string, from: string, to: string, enabled = true) {
  const [result, setResult] = useState<CompareVersionsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const client = useApiClient();

  useEffect(() => {
    if (!from || !to || !enabled) {
      setResult(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    client
      .compareVersions(name, from, to)
      .then(setResult)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [name, from, to, enabled]);

  return { result, loading, error };
}
