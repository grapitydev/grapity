import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useSpecs } from "../hooks/useSpecs";
import { SpecList } from "../components/spec/SpecList";
import { Input } from "../components/ui/input";

interface SpecListPageProps {
  filters?: { type?: string; owner?: string; tags?: string[]; classification?: string };
}

export function SpecListPage({ filters = {} }: SpecListPageProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const { classification, ...serverFilters } = filters;
  const { specs, loading, error } = useSpecs(serverFilters);

  const filteredSpecs = useMemo(() => {
    if (!classification) return specs;
    const matchMap: Record<string, string[]> = {
      major: ["initial", "major"],
      minor: ["minor"],
      patch: ["patch"],
    };
    const allowed = matchMap[classification];
    if (!allowed) return specs;
    return specs.filter((s) => allowed.includes(s.latestVersion?.compatibility?.classification ?? ""));
  }, [specs, classification]);

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

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <Input
          type="search"
          placeholder="Search specs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <SpecList specs={filteredSpecs} loading={loading} searchQuery={searchQuery} />
    </div>
  );
}
