import { ExternalLink, Mail } from "lucide-react";

export function OverviewFooter() {
  return (
    <footer className="mt-20 border-t border-surface-border pt-6 pb-10 min-h-32">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-text-secondary">Grapity</span>
          <a
            href="https://grapity.dev/docs/cli-reference/init"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <ExternalLink className="h-3 w-3" />
            Docs
          </a>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="mailto:support@grapity.dev"
            className="inline-flex items-center gap-1 text-xs text-text-muted transition-colors hover:text-text-secondary"
          >
            <Mail className="h-3 w-3" />
            support@grapity.dev
          </a>
        </div>
      </div>
    </footer>
  );
}
