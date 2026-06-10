import { useState } from "react";
import { CodeBlock } from "./CodeBlock";

interface RawSpecTabProps {
  jsonContent: string;
  yamlContent: string;
  loading: boolean;
}

export function RawSpecTab({ jsonContent, yamlContent, loading }: RawSpecTabProps) {
  const [format, setFormat] = useState<"json" | "yaml">("json");

  const content = format === "json" ? jsonContent : yamlContent;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setFormat("json")}
          className={`rounded-sm px-3 py-1 text-sm font-medium transition-colors ${
            format === "json"
              ? "bg-accent-indigo/10 text-accent-indigo"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          JSON
        </button>
        <button
          onClick={() => setFormat("yaml")}
          className={`rounded-sm px-3 py-1 text-sm font-medium transition-colors ${
            format === "yaml"
              ? "bg-accent-indigo/10 text-accent-indigo"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          YAML
        </button>
      </div>
      {loading ? (
        <div className="h-64 rounded-md bg-surface-hover animate-pulse" />
      ) : (
        <CodeBlock content={content} language={format} />
      )}
    </div>
  );
}
