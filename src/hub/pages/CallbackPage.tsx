import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";
import { useAuth, clearAuthSession, getAndClearPostLoginPath } from "../context/AuthContext";

export function CallbackPage() {
  const { auth } = useConfig();
  const { handleCallback } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      navigate("/", { replace: true });
      return;
    }

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorDescription = searchParams.get("error_description") ?? searchParams.get("error");

    if (errorDescription) {
      setError(`Login failed: ${errorDescription}`);
      clearAuthSession();
      return;
    }

    if (!code || !state) {
      setError("Missing authorization code or state.");
      return;
    }

    handleCallback(code, state)
      .then(() => {
        const redirectPath = getAndClearPostLoginPath();
        navigate(redirectPath, { replace: true });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Login failed");
        clearAuthSession();
      });
  }, [auth, handleCallback, navigate, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="rounded-lg border border-accent-rose/30 bg-accent-rose/10 p-6 text-accent-rose">
          <h1 className="mb-2 text-xl font-semibold">Authentication failed</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-muted-foreground">
      Completing login…
    </div>
  );
}
