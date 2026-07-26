import { LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";

interface ErrorStateProps {
  title: string;
  message: string;
}

export function ErrorState({ title, message }: ErrorStateProps) {
  const { auth } = useConfig();
  const { isAuthenticated, login } = useAuth();
  const anonymous = !!auth && !isAuthenticated;

  return (
    <div className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-6">
      <p className="text-sm text-accent-rose mb-2">{title}</p>
      <p className="text-xs text-text-secondary">
        {anonymous
          ? "This spec does not exist or is private. Sign in to view private specs."
          : message}
      </p>
      {anonymous && (
        <button
          onClick={login}
          className="mt-4 flex items-center gap-2 rounded-sm border border-surface-border px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
        >
          <LogIn className="h-4 w-4" />
          Sign in
        </button>
      )}
    </div>
  );
}
