import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { GrapityLogo, GrapityWordmark } from "../components/branding/Logo";

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const { auth } = useConfig();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!auth || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-text-secondary">
        Loading…
      </div>
    );
  }

  const handleClick = () => {
    setIsRedirecting(true);
    login();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface-base">
      <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-base p-10 shadow-sm">
        <div className="mb-8 flex items-center justify-center gap-3">
          <GrapityLogo className="h-8 w-8" />
          <GrapityWordmark className="font-display text-xl font-semibold tracking-tight" />
        </div>

        <p className="mb-8 text-center text-sm text-text-secondary">
          Explore and manage your API specs.
        </p>

        <button
          onClick={handleClick}
          disabled={isRedirecting}
          className="w-full rounded-sm bg-accent-indigo px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-indigo-light disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isRedirecting ? "Redirecting…" : "Sign in with Keycloak"}
        </button>

        <p className="mt-6 text-center text-xs text-text-secondary">
          You will be redirected to your organization&apos;s Keycloak sign-in page.
        </p>
      </div>
    </div>
  );
}
