import { useState, useEffect } from "react";
import { useApiClient } from "../api/client";
import type { PublicSpecVersion, PaginationMeta } from "core";

export function useVersions(name: string) {
  const [versions, setVersions] = useState<PublicSpecVersion[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const client = useApiClient();

  useEffect(() => {
    setVersions([]);
    setPagination(null);
    setLoading(true);
    setError(null);
    client
      .listVersions(name)
      .then((res) => {
        setVersions(res.data);
        setPagination(res.pagination);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [name]);

  return { versions, pagination, loading, error };
}
