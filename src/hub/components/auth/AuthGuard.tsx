import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { LoginPage } from "../../pages/LoginPage";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { auth } = useConfig();
  const { isAuthenticated, isLoading } = useAuth();

  if (!auth) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-text-secondary">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
