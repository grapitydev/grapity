import { useState, useEffect } from "react";
import { useApiClient } from "../api/client";
import type { Spec, PublicSpecVersion } from "core";

export function useSpec(name: string) {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [latestVersion, setLatestVersion] = useState<PublicSpecVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const client = useApiClient();

  useEffect(() => {
    setSpec(null);
    setLatestVersion(null);
    setLoading(true);
    setError(null);
    client
      .getSpec(name)
      .then((data) => {
        setSpec(data.spec);
        setLatestVersion(data.latestVersion ?? null);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [name]);

  return { spec, latestVersion, loading, error };
}
