import { EndpointCard } from "./EndpointCard";
import type { EndpointGroup } from "../../context/SpecExplorerContext";

interface EndpointListProps {
  groups: EndpointGroup[];
}

export function EndpointList({ groups }: EndpointListProps) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.name}>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-text-secondary mb-3 border-b border-surface-border pb-2">
            {group.name}
          </h3>
          <div className="space-y-16">
            {group.endpoints.map((endpoint) => (
              <EndpointCard key={endpoint.id} endpoint={endpoint} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
