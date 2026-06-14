import type { Endpoint } from "../../context/SpecExplorerContext";
import { SchemaPropertyTree } from "./SchemaPropertyTree";
import { CodeBlock } from "./CodeBlock";
import { Badge } from "../ui/badge";
import { Lock } from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  POST: "bg-green-500/10 text-green-400 border-green-500/30",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/30",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

function MethodBadge({ method }: { method: string }) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 font-mono text-xs font-semibold ${
        METHOD_COLORS[method] ?? "bg-surface-hover text-text-secondary border-surface-border"
      }`}
    >
      {method}
    </span>
  );
}

function SunsetLabel({ date }: { date?: string }) {
  if (!date) return <span className="text-xs text-text-muted">No sunset date scheduled</span>;
  const d = new Date(date);
  const isPast = d < new Date();
  if (isPast) return <span className="text-xs text-accent-rose">Sunset passed: {date}</span>;
  return <span className="text-xs text-text-muted">Sunset: {date}</span>;
}

function ParamRow({ param }: { param: Endpoint["parameters"][0] }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-secondary flex-wrap">
      <span className={`font-mono ${param.deprecated ? "line-through text-text-muted" : "text-text-primary"}`}>
        {param.name}
      </span>
      <span className="text-text-muted">({param.type})</span>
      {param.required && (
        <span className="text-accent-rose">*</span>
      )}
      {param.deprecated && (
        <span className="inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium bg-accent-amber/10 text-accent-amber">
          Deprecated
        </span>
      )}
      {param.deprecated && param.xSunset && (
        <SunsetLabel date={param.xSunset} />
      )}
    </span>
  );
}

function buildCurl(endpoint: Endpoint): string {
  const url = `${endpoint.serverUrl}${endpoint.path}`;
  const lines = [`curl -X ${endpoint.method} ${url} \\n  -H "Content-Type: application/json" \\n`];

  if (endpoint.security && endpoint.security.length > 0) {
    lines.push('  -H "Authorization: Bearer <token>" \\n');
  }

  if (endpoint.exampleRequest) {
    const body = endpoint.exampleRequest.replace(/'/g, "'\\''");
    lines.push(`  -d '${body}'`);
  }

  return lines.join("");
}

function SecurityRow({ security }: { security: Endpoint["security"] }) {
  if (!security || security.length === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
        <Lock className="h-3.5 w-3.5" />
        No authentication required
      </span>
    );
  }

  const { schemeName, scopes } = security[0];
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
        <Lock className="h-3.5 w-3.5" />
        Auth:
      </span>
      <Badge variant="indigo">{schemeName}</Badge>
      {scopes.length > 0 && (
        <span className="inline-flex flex-wrap items-center gap-1">
          {scopes.map((scope) => (
            <Badge key={scope} variant="default">
              {scope}
            </Badge>
          ))}
        </span>
      )}
    </span>
  );
}

function statusBadgeClass(status: string): string {
  if (status.startsWith("2")) return "bg-green-500/10 text-green-400";
  if (status.startsWith("3")) return "bg-blue-500/10 text-blue-400";
  if (status.startsWith("4")) return "bg-amber-500/10 text-amber-400";
  if (status.startsWith("5")) return "bg-red-500/10 text-red-400";
  return "bg-surface-hover text-text-secondary";
}

export function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  return (
    <div id={endpoint.id} className={endpoint.deprecated ? "opacity-70" : undefined}>
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <MethodBadge method={endpoint.method} />
        <code className={`font-mono text-sm ${endpoint.deprecated ? "line-through text-text-muted" : "text-text-primary"}`}>
          {endpoint.path}
        </code>
        {endpoint.deprecated && (
          <span className="inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium bg-accent-amber/10 text-accent-amber">
            Deprecated
          </span>
        )}
      </div>
      {endpoint.deprecated && (
        <div className="mb-3 rounded-sm border-l-2 border-accent-amber bg-accent-amber/5 px-3 py-2">
          <p className="text-sm text-accent-amber">
            This endpoint is deprecated.
            {endpoint.xSunset ? (
              <> It will be removed on <strong>{endpoint.xSunset}</strong>.</>
            ) : (
              <> No sunset date is scheduled yet, but migration is strongly recommended.</>
            )}
          </p>
        </div>
      )}
      {endpoint.summary && (
        <p className="text-sm text-text-secondary mb-2">{endpoint.summary}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
        <SecurityRow security={endpoint.security} />
      </div>
      {endpoint.description && (
        <p className="text-sm text-text-muted mb-3">{endpoint.description}</p>
      )}
      {endpoint.parameters.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {endpoint.parameters.map((p) => (
            <ParamRow key={p.name} param={p} />
          ))}
        </div>
      )}

      <div className="pl-4">
        {endpoint.requestBody && endpoint.exampleRequest && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Request Body
                {endpoint.requestBody.required && <span className="text-accent-rose ml-1">*</span>}
              </h4>
              <SchemaPropertyTree properties={endpoint.requestBody.properties} />
            </div>
            <CodeBlock content={buildCurl(endpoint)} language="bash" />
          </div>
        )}

        {endpoint.requestBody && !endpoint.exampleRequest && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Request Body
              {endpoint.requestBody.required && <span className="text-accent-rose ml-1">*</span>}
            </h4>
            <SchemaPropertyTree properties={endpoint.requestBody.properties} />
          </div>
        )}

        {!endpoint.requestBody && endpoint.exampleRequest && (
          <div className="mt-6">
            <CodeBlock content={buildCurl(endpoint)} language="bash" />
          </div>
        )}

        {endpoint.responses.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
              Responses
            </h4>
            <div className="space-y-6">
              {endpoint.responses.map((resp) => (
                <div key={resp.status}>
                  {resp.exampleBody ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      <div>
                        <div className="flex items-baseline gap-2 mb-1">
                          <span
                            className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${statusBadgeClass(resp.status)}`}
                          >
                            {resp.status}
                          </span>
                          <span className="text-sm text-text-secondary">{resp.description}</span>
                        </div>
                        {resp.properties && resp.properties.length > 0 && (
                          <SchemaPropertyTree properties={resp.properties} />
                        )}
                      </div>
                      <CodeBlock content={resp.exampleBody} language="json" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-xs font-semibold ${statusBadgeClass(resp.status)}`}
                        >
                          {resp.status}
                        </span>
                        <span className="text-sm text-text-secondary">{resp.description}</span>
                      </div>
                      {resp.properties && resp.properties.length > 0 && (
                        <div className="ml-2">
                          <SchemaPropertyTree properties={resp.properties} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
