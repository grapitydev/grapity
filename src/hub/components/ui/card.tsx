import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-lg border border-surface-border bg-surface-elevated p-4 transition-colors ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
