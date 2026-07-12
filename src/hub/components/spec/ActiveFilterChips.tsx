import { X } from "lucide-react";

interface Filters {
  type?: string;
  owner?: string;
  tags?: string[];
  classification?: string;
}

interface ActiveFilterChipsProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function formatClassification(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function ActiveFilterChips({ filters, onChange }: ActiveFilterChipsProps) {
  const chips: { label: string; onRemove: () => void }[] = [];

  if (filters.type) {
    chips.push({
      label: `Type: ${filters.type}`,
      onRemove: () => onChange({ ...filters, type: undefined }),
    });
  }

  if (filters.owner) {
    chips.push({
      label: `Owner: ${filters.owner}`,
      onRemove: () => onChange({ ...filters, owner: undefined }),
    });
  }

  filters.tags?.forEach((tag) => {
    chips.push({
      label: `Tag: ${tag}`,
      onRemove: () => {
        const next = filters.tags?.filter((t) => t !== tag) ?? [];
        onChange({ ...filters, tags: next.length ? next : undefined });
      },
    });
  });

  if (filters.classification) {
    chips.push({
      label: `Classification: ${formatClassification(filters.classification)}`,
      onRemove: () => onChange({ ...filters, classification: undefined }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4" data-testid="active-filter-chips">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center gap-1 rounded-full border border-surface-border bg-surface-elevated px-2.5 py-1 text-xs text-text-primary"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="ml-1 rounded-full p-0.5 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label={`Remove ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onChange({})}
        className="text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        Clear all
      </button>
    </div>
  );
}
