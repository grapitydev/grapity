import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { GrapityLogo, GrapityWordmark } from "../components/branding/Logo";
import { Button } from "../components/ui/button";

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
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-surface-border bg-surface-elevated p-5">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2.5">
            <GrapityLogo className="h-8 w-8" />
            <GrapityWordmark className="font-display text-xl font-semibold tracking-tight" />
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); handleClick(); }}>
          <p className="text-center text-sm text-text-secondary">
            Explore and manage your API specs.
          </p>

          <Button
            type="submit"
            disabled={isRedirecting}
            className="w-full"
          >
            {isRedirecting ? "Redirecting…" : "Sign in with Keycloak"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-text-secondary">
          You will be redirected to your organization&apos;s Keycloak sign-in page.
        </p>
      </div>
    </div>
  );
}
