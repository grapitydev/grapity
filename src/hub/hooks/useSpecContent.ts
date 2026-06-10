import { useState, useEffect } from "react";
import { useApiClient } from "../api/client";

export function useSpecContent(name: string, semver: string, format: "json" | "yaml") {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const client = useApiClient();

  useEffect(() => {
    setLoading(true);
    setError(null);
    client
      .getSpecContent(name, semver, format)
      .then(setContent)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [name, semver, format]);

  return { content, loading, error };
}
