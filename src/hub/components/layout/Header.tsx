import { Link } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface-base/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-3">
          <svg className="h-7 w-7" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <path d="M7 24 L16 6 L25 24 L21 24 L16 14 L11 24 Z" fill="url(#logo-g)" />
            <circle cx="16" cy="24" r="2.5" fill="url(#logo-g)" />
          </svg>
          <span className="font-display text-lg font-semibold tracking-tight">
            <span className="text-text-primary">grapity</span>{" "}
            <span className="text-text-secondary">Hub</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
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
