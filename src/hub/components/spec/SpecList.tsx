import { useState } from "react";
import { SpecCard } from "../spec/SpecCard";
import { Skeleton } from "../ui/skeleton";
import type { SpecListItem } from "@grapity/core";

interface SpecListProps {
  specs: SpecListItem[];
  loading: boolean;
  searchQuery: string;
}

export function SpecList({ specs, loading, searchQuery }: SpecListProps) {
  const filtered = searchQuery.trim()
    ? specs.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : specs;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-display font-semibold text-text-primary mb-2">
          No specs match your filters
        </p>
        <p className="text-sm text-text-secondary mb-6">
          {searchQuery
            ? "Try adjusting your search query."
            : "Push your first spec with:"}
        </p>
        {!searchQuery && (
          <code className="rounded-md bg-surface-code px-4 py-2 font-mono text-sm text-text-secondary">
            grapity registry push ./openapi.yaml --name my-api
          </code>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((spec) => (
        <SpecCard
          key={spec.id}
          spec={spec}
          latestVersion={
            spec.latestVersion
              ? {
                  semver: spec.latestVersion.semver,
                  classification: spec.latestVersion.compatibility?.classification,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
