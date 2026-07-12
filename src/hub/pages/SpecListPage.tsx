import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import type { SpecListItem } from "core";
import { SpecList } from "../components/spec/SpecList";
import { ActiveFilterChips } from "../components/spec/ActiveFilterChips";
import { Input } from "../components/ui/input";

interface Filters {
  type?: string;
  owner?: string;
  tags?: string[];
  classification?: string;
}

interface SpecListPageProps {
  filters?: Filters;
  onFilterChange?: (filters: Filters) => void;
  specs?: SpecListItem[];
  loading?: boolean;
  error?: Error | null;
}

export function SpecListPage({
  filters = {},
  onFilterChange,
  specs = [],
  loading = false,
  error = null,
}: SpecListPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSpecs = useMemo(() => {
    let result = specs;

    if (filters.type) {
      result = result.filter((s) => s.type === filters.type);
    }

    if (filters.owner) {
      result = result.filter((s) => s.owner === filters.owner);
    }

    if (filters.tags?.length) {
      result = result.filter((s) =>
        filters.tags!.every((tag) => s.tags?.includes(tag))
      );
    }

    if (filters.classification) {
      const matchMap: Record<string, string[]> = {
        major: ["initial", "major"],
        minor: ["minor"],
        patch: ["patch"],
      };
      const allowed = matchMap[filters.classification];
      if (allowed) {
        result = result.filter((s) =>
          allowed.includes(s.latestVersion?.compatibility?.classification ?? "")
        );
      }
    }

    return result;
  }, [specs, filters]);

  if (error) {
    return (
      <div className="rounded-lg border border-accent-rose/20 bg-accent-rose/5 p-6">
        <p className="text-sm text-accent-rose mb-2">Failed to load specs</p>
        <p className="text-xs text-text-secondary">{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
          Browse All Specs
        </h1>
        <p className="text-sm text-text-secondary">
          {filteredSpecs.length} spec{filteredSpecs.length !== 1 ? "s" : ""} in the registry
        </p>
      </div>

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="search"
          placeholder="Search specs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {onFilterChange && (
        <ActiveFilterChips filters={filters} onChange={onFilterChange} />
      )}

      <SpecList specs={filteredSpecs} loading={loading} searchQuery={searchQuery} />
    </div>
  );
}
