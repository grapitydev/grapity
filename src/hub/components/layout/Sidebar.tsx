import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Tag, User, FileJson, ChevronRight, ChevronDown, Layers } from "lucide-react";
import { Button } from "../ui/button";
import { useSpecExplorer } from "../../context/SpecExplorerContext";
import { getClassificationPillStyle } from "../../lib/classificationStyles";
import { getMethodTextStyle } from "../../lib/methodStyles";

interface SidebarProps {
  filters?: {
    type?: string;
    owner?: string;
    tags?: string[];
    classification?: string;
    onFilterChange: (filters: { type?: string; owner?: string; tags?: string[]; classification?: string }) => void;
  };
}

export function Sidebar({ filters }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { endpoints, activeEndpointId, setActiveEndpointId, setScrollSuppressed } = useSpecExplorer();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Expand all groups when endpoints load
  useEffect(() => {
    if (endpoints && endpoints.length > 0) {
      setExpandedGroups(new Set(endpoints.map((g) => g.name)));
    } else {
      setExpandedGroups(new Set());
    }
  }, [endpoints]);

  // Auto-expand group containing active endpoint
  useEffect(() => {
    if (!activeEndpointId || !endpoints) return;
    const activeGroup = endpoints.find((g) =>
      g.endpoints.some((ep) => ep.id === activeEndpointId)
    );
    if (activeGroup && !expandedGroups.has(activeGroup.name)) {
      setExpandedGroups((prev) => new Set([...prev, activeGroup.name]));
    }
  }, [activeEndpointId, endpoints]);

  // Auto-scroll sidebar to keep active endpoint visible
  useEffect(() => {
    if (!activeEndpointId) return;
    const sidebarEl = document.querySelector("aside");
    const activeLink = sidebarEl?.querySelector(`[data-endpoint-id="${activeEndpointId}"]`);
    if (activeLink) {
      activeLink.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeEndpointId]);

  const isSpecDetail = location.pathname.startsWith("/specs/") && !location.pathname.includes("/diff");
  const showBack = isSpecDetail;

  function goBack() {
    navigate("/");
  }

  function toggleGroup(group: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  }

  function scrollToEndpoint(id: string) {
    setActiveEndpointId(id);
    setScrollSuppressed(true);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsOpen(false);
    setTimeout(() => setScrollSuppressed(false), 400);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 rounded-full bg-accent-indigo p-3 text-text-inverse shadow-lg lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Filter className="h-5 w-5" />
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-surface-border bg-surface-base transition-transform overflow-y-auto lg:static lg:translate-x-0 lg:h-full ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6 p-4 pt-16 lg:pt-4">
          {showBack && (
            <Button variant="ghost" onClick={goBack} className="w-full justify-start gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}

          {endpoints && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                <FileJson className="h-3 w-3" />
                Endpoints
              </h3>
              <div className="space-y-2">
                {endpoints.map((group) => {
                  const isGroupActive = group.endpoints.some((ep) => ep.id === activeEndpointId);
                  return (
                    <div key={group.name}>
                      <button
                        onClick={() => toggleGroup(group.name)}
                        className={`flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-sm font-medium transition-colors hover:bg-surface-hover ${
                          isGroupActive ? "text-accent-indigo" : "text-text-primary"
                        }`}
                      >
                        {expandedGroups.has(group.name) ? (
                          <ChevronDown className="h-4 w-4 text-text-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-text-muted" />
                        )}
                        {group.name}
                      </button>
                      {expandedGroups.has(group.name) && (
                        <div className="ml-5 space-y-1">
                          {group.endpoints.map((ep) => {
                            const isActive = ep.id === activeEndpointId;
                            return (
                              <button
                                key={ep.id}
                                data-endpoint-id={ep.id}
                                onClick={() => scrollToEndpoint(ep.id)}
                                className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors ${
                                  isActive
                                    ? "bg-accent-indigo/10 text-accent-indigo font-medium"
                                    : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                                }`}
                                title={`${ep.method} ${ep.path}`}
                              >
                                <span
                                  className={`font-mono text-xs font-semibold ${getMethodTextStyle(
                                    ep.method
                                  )}`}
                                >
                                  {ep.method}
                                </span>
                                <span className="flex items-center gap-1 min-w-0">
                                  <span className={`truncate ${ep.deprecated ? "line-through text-text-muted" : ""}`}>
                                    {ep.path}
                                  </span>
                                  {ep.deprecated && (
                                    <span className="text-text-muted text-[10px] shrink-0">(Deprecated)</span>
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filters && !endpoints && (
            <>
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <FileJson className="h-3 w-3" />
                  Type
                </h3>
                <div className="space-y-1">
                  {["openapi", "asyncapi"].map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        filters.onFilterChange({
                          ...filters,
                          type: filters.type === type ? undefined : type,
                        })
                      }
                      className={`block w-full rounded-sm px-2 py-1 text-left text-sm transition-colors ${
                        filters.type === type
                          ? "bg-accent-indigo/10 text-accent-indigo"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <User className="h-3 w-3" />
                  Owner
                </h3>
                <div className="space-y-1">
                  {["platform-team", "payments-team", "api-team"].map((owner) => (
                    <button
                      key={owner}
                      onClick={() =>
                        filters.onFilterChange({
                          ...filters,
                          owner: filters.owner === owner ? undefined : owner,
                        })
                      }
                      className={`block w-full rounded-sm px-2 py-1 text-left text-sm transition-colors ${
                        filters.owner === owner
                          ? "bg-accent-indigo/10 text-accent-indigo"
                          : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                      }`}
                    >
                      {owner}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <Tag className="h-3 w-3" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1">
                  {["payments", "public", "internal"].map((tag) => {
                    const isSelected = filters.tags?.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => {
                          const current = filters.tags ?? [];
                          const next = isSelected
                            ? current.filter((t) => t !== tag)
                            : [...current, tag];
                          filters.onFilterChange({ ...filters, tags: next.length ? next : undefined });
                        }}
                        className={`rounded-sm px-2 py-0.5 text-xs transition-colors ${
                          isSelected
                            ? "bg-accent-indigo/10 text-accent-indigo"
                            : "bg-surface-hover text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  <Layers className="h-3 w-3" />
                  Classification
                </h3>
                <div className="flex flex-wrap gap-1">
                  {[
                    { key: "major", label: "Major", match: ["initial", "major"] },
                    { key: "minor", label: "Minor", match: ["minor"] },
                    { key: "patch", label: "Patch", match: ["patch"] },
                  ].map((item) => {
                    const isSelected = filters.classification === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() =>
                          filters.onFilterChange({
                            ...filters,
                            classification: isSelected ? undefined : item.key,
                          })
                        }
                        className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-bold transition-colors ${
                          isSelected
                            ? getClassificationPillStyle(item.key as "major" | "minor" | "patch")
                            : "bg-surface-hover text-text-secondary hover:text-text-primary"
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
