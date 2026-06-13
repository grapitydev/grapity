import { Badge } from "../ui/badge";
import { Plus, Pencil, Minus } from "lucide-react";
import type { CompatReport as CompatReportType, BreakingChange, SafeChange } from "core";

interface ChangelogProps {
  report: CompatReportType | null;
  isInitial?: boolean;
}

type ChangeCategory = "additions" | "updates" | "removals";

interface CategorizedChange {
  id: string;
  rule: string;
  description: string;
  path: string;
  category: ChangeCategory;
}

function categorizeChange(rule: string): ChangeCategory {
  if (rule.endsWith("-added")) return "additions";
  if (rule.endsWith("-removed")) return "removals";
  return "updates";
}

function toCategorized(change: BreakingChange | SafeChange): CategorizedChange {
  return {
    id: change.id,
    rule: change.rule,
    description: change.description,
    path: change.path,
    category: categorizeChange(change.rule),
  };
}

const SECTION_CONFIG: Record<
  ChangeCategory,
  { label: string; borderColor: string; iconColor: string; badgeVariant: "green" | "amber" | "rose"; Icon: typeof Plus }
> = {
  additions: {
    label: "Additions",
    borderColor: "border-accent-green",
    iconColor: "text-accent-green",
    badgeVariant: "green",
    Icon: Plus,
  },
  updates: {
    label: "Updates",
    borderColor: "border-accent-amber",
    iconColor: "text-accent-amber",
    badgeVariant: "amber",
    Icon: Pencil,
  },
  removals: {
    label: "Removals",
    borderColor: "border-accent-rose",
    iconColor: "text-accent-rose",
    badgeVariant: "rose",
    Icon: Minus,
  },
};

function ChangeSection({ category, changes }: { category: ChangeCategory; changes: CategorizedChange[] }) {
  const config = SECTION_CONFIG[category];
  const { Icon } = config;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-display text-base font-semibold text-text-primary">{config.label}</h3>
        <Badge variant={config.badgeVariant}>{changes.length}</Badge>
      </div>
      <div className="space-y-2">
        {changes.map((change) => (
          <div key={change.id} className={`border-l-2 pl-3 py-2 ${config.borderColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
              <span className="font-mono text-xs text-text-secondary">{change.rule}</span>
            </div>
            <p className="text-sm text-text-primary">{change.description}</p>
            {change.path && (
              <p className="mt-0.5 font-mono text-xs text-text-muted">{change.path}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Changelog({ report, isInitial }: ChangelogProps) {
  if (isInitial || !report) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-text-secondary">This is the initial version.</p>
      </div>
    );
  }

  const allChanges = [
    ...report.breakingChanges.map(toCategorized),
    ...report.safeChanges.map(toCategorized),
  ];

  const additions = allChanges.filter((c) => c.category === "additions");
  const updates = allChanges.filter((c) => c.category === "updates");
  const removals = allChanges.filter((c) => c.category === "removals");

  const hasChanges = additions.length > 0 || updates.length > 0 || removals.length > 0;

  if (!hasChanges) {
    return <p className="text-sm text-text-secondary">No changes detected.</p>;
  }

  return (
    <div className="space-y-6">
      {additions.length > 0 && <ChangeSection category="additions" changes={additions} />}
      {updates.length > 0 && <ChangeSection category="updates" changes={updates} />}
      {removals.length > 0 && <ChangeSection category="removals" changes={removals} />}
    </div>
  );
}
