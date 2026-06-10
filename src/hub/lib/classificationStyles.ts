import type { VersionClassification } from "core";

const classificationColors: Record<VersionClassification, string> = {
  initial: "bg-accent-indigo/15 text-accent-indigo",
  major: "bg-accent-indigo/15 text-accent-indigo",
  minor: "bg-accent-blue/15 text-accent-blue",
  patch: "bg-accent-cyan/15 text-accent-cyan",
};

export function getClassificationPillStyle(
  classification: VersionClassification | undefined
): string {
  return classification ? classificationColors[classification] : "bg-surface-hover text-text-secondary";
}
