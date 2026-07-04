import { Link } from "react-router-dom";
import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { GrapityLogo, GrapityWordmark } from "../branding/Logo";

export function Header() {
  const { theme, toggle } = useTheme();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { auth } = useConfig();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface-base/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <GrapityLogo className="h-7 w-7" />
          <GrapityWordmark className="font-display text-lg font-semibold tracking-tight" />
        </Link>

        <div className="flex items-center gap-2">
          {auth && !isLoading && isAuthenticated && (
            <button
              onClick={logout}
              className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary hover:bg-surface-hover"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          )}
          <button
            onClick={toggle}
            className="rounded-sm p-2 text-text-secondary transition-colors hover:text-text-primary hover:bg-surface-hover"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
