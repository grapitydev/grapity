import type { SchemaProperty } from "../../context/SpecExplorerContext";

interface SchemaPropertyTreeProps {
  properties: SchemaProperty[];
}

function SunsetLabel({ date }: { date?: string }) {
  if (!date) return null;
  const d = new Date(date);
  const isPast = d < new Date();
  if (isPast) return <span className="text-xs text-accent-rose">Sunset passed: {date}</span>;
  return <span className="text-xs text-text-muted">Sunset: {date}</span>;
}

export function SchemaPropertyTree({ properties }: SchemaPropertyTreeProps) {
  return (
    <div className="space-y-1">
      {properties.map((prop) => (
        <div key={prop.name} className={prop.deprecated ? "opacity-70" : undefined}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`font-mono text-sm ${prop.deprecated ? "line-through text-text-muted" : "text-text-primary"}`}>
              {prop.name}
              {prop.required && <span className="text-accent-rose">*</span>}
            </span>
            <span className="text-xs text-text-muted">{prop.type}</span>
            {prop.format && (
              <span className="text-xs text-text-muted">({prop.format})</span>
            )}
            {prop.deprecated && (
              <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-accent-amber/10 text-accent-amber">
                Deprecated
              </span>
            )}
            {prop.deprecated && prop.xSunset && (
              <SunsetLabel date={prop.xSunset} />
            )}
          </div>
          {prop.description && (
            <p className="text-xs text-text-secondary">{prop.description}</p>
          )}
          {prop.properties && prop.properties.length > 0 && (
            <div className="ml-4 pl-3 mt-1">
              <SchemaPropertyTree properties={prop.properties} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
