import { useEffect, useState, useCallback } from "react";
import { CopyButton } from "../ui/CopyButton";
import { getHighlighter } from "../../lib/shiki";

interface CodeBlockProps {
  content: string;
  language: string;
  showCopy?: boolean;
  className?: string;
}

function formatJson(content: string): string {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function getShikiTheme(): string {
  return document.documentElement.classList.contains("light")
    ? "catppuccin-latte"
    : "catppuccin-mocha";
}

function renderBash(content: string): React.ReactNode {
  const lines = content.split("\n");
  return (
    <pre className="p-4 text-sm font-mono leading-relaxed text-text-primary">
      <code>
        {lines.map((line, i) => {
          const trimmed = line.trimStart();
          if (trimmed.startsWith("$ ")) {
            const indent = line.slice(0, line.length - trimmed.length);
            return (
              <span key={i}>
                {indent}
                <span className="text-text-muted">$</span>
                {" "}
                {trimmed.slice(2)}
                {i < lines.length - 1 ? "\n" : ""}
              </span>
            );
          }
          return (
            <span key={i}>
              {line}
              {i < lines.length - 1 ? "\n" : ""}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

export function CodeBlock({ content, language, showCopy = true, className = "" }: CodeBlockProps) {
  const [html, setHtml] = useState<string>("");
  const formatted = language === "json" ? formatJson(content) : content;
  const isBash = language === "bash";

  const highlight = useCallback(async () => {
    if (isBash) return;
    const highlighter = await getHighlighter();
    const lang = language === "json" || language === "yaml" ? language : "text";
    const result = highlighter.codeToHtml(formatted, {
      lang,
      theme: getShikiTheme(),
    });
    setHtml(result);
  }, [formatted, language, isBash]);

  useEffect(() => {
    if (isBash) return;

    let cancelled = false;

    async function doHighlight() {
      const highlighter = await getHighlighter();
      if (cancelled) return;

      const lang = language === "json" || language === "yaml" ? language : "text";
      const result = highlighter.codeToHtml(formatted, {
        lang,
        theme: getShikiTheme(),
      });
      if (!cancelled) setHtml(result);
    }

    doHighlight();

    return () => {
      cancelled = true;
    };
  }, [formatted, language, isBash]);

  useEffect(() => {
    if (isBash) return;

    const observer = new MutationObserver(() => {
      highlight();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, [highlight, isBash]);

  return (
    <div className={`relative rounded-md border border-surface-border bg-surface-code ${className}`}>
      {showCopy && (
        <div className="absolute right-2 top-2 z-10">
          <CopyButton text={formatted} />
        </div>
      )}
      <div className="overflow-auto">
        {isBash ? (
          renderBash(formatted)
        ) : html ? (
          <div
            className="p-4 text-sm font-mono leading-relaxed shiki-code"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="p-4 text-sm font-mono leading-relaxed text-text-primary">
            <code>{formatted}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
