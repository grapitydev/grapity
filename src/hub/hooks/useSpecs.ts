import { useState, useEffect } from "react";
import { useApiClient } from "../api/client";
import type { SpecListItem } from "core";

export function useSpecs(filters?: { type?: string; owner?: string; tags?: string[] }, enabled: boolean = true) {
  const [specs, setSpecs] = useState<SpecListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const client = useApiClient();

  useEffect(() => {
    if (!enabled) {
      setSpecs([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    client
      .listSpecs(filters)
      .then(setSpecs)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [enabled, filters?.type, filters?.owner, filters?.tags?.join(",")]);

  return { specs, loading, error };
}
