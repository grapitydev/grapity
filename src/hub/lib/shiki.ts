import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["catppuccin-mocha", "catppuccin-latte"],
      langs: ["json", "bash", "yaml"],
    });
  }
  return highlighterPromise;
}
