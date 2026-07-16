import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { HighlighterCore } from "shiki/types";
import langJson from "@shikijs/langs/json";
import langBash from "@shikijs/langs/bash";
import langYaml from "@shikijs/langs/yaml";
import themeCatppuccinMocha from "@shikijs/themes/catppuccin-mocha";
import themeCatppuccinLatte from "@shikijs/themes/catppuccin-latte";

let highlighterPromise: Promise<HighlighterCore> | null = null;

export function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [themeCatppuccinMocha, themeCatppuccinLatte],
      langs: [langJson, langBash, langYaml],
      engine: createJavaScriptRegexEngine({ forgiving: true }),
    });
  }
  return highlighterPromise;
}
