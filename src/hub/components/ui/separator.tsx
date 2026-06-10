interface SeparatorProps {
  className?: string;
}

export function Separator({ className = "" }: SeparatorProps) {
  return <div className={`h-px bg-surface-border ${className}`} />;
}
