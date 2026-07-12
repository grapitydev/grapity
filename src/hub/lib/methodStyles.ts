const METHOD_PILL_STYLES: Record<string, string> = {
  GET: "bg-method-get/10 text-method-get border-method-get/30",
  POST: "bg-method-post/10 text-method-post border-method-post/30",
  PUT: "bg-method-put/10 text-method-put border-method-put/30",
  DELETE: "bg-method-delete/10 text-method-delete border-method-delete/30",
  PATCH: "bg-method-patch/10 text-method-patch border-method-patch/30",
};

const METHOD_TEXT_STYLES: Record<string, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  DELETE: "text-method-delete",
  PATCH: "text-method-patch",
};

const FALLBACK_PILL = "bg-surface-hover text-text-secondary border-surface-border";
const FALLBACK_TEXT = "text-text-muted";

export function getMethodPillStyle(method: string): string {
  return METHOD_PILL_STYLES[method.toUpperCase()] ?? FALLBACK_PILL;
}

export function getMethodTextStyle(method: string): string {
  return METHOD_TEXT_STYLES[method.toUpperCase()] ?? FALLBACK_TEXT;
}

export function getStatusBadgeClass(status: string): string {
  const base = "rounded px-1.5 py-0.5 font-mono text-xs font-semibold border";

  if (status.startsWith("2")) {
    return `${base} bg-method-post/10 text-method-post border-method-post/30`;
  }
  if (status.startsWith("3")) {
    return `${base} bg-method-get/10 text-method-get border-method-get/30`;
  }
  if (status.startsWith("4")) {
    return `${base} bg-method-put/10 text-method-put border-method-put/30`;
  }
  if (status.startsWith("5")) {
    return `${base} bg-method-delete/10 text-method-delete border-method-delete/30`;
  }

  return `${base} bg-surface-hover text-text-secondary border-surface-border`;
}
