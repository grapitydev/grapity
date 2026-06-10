import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`flex h-9 w-full rounded-sm border border-surface-border bg-surface-elevated px-3 py-1 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-indigo/50 focus:ring-1 focus:ring-accent-indigo/20 ${className}`}
      {...props}
    />
  );
}
