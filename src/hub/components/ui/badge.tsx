import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "indigo" | "rose" | "green" | "cyan" | "amber" | "purple";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-surface-hover text-text-secondary",
    indigo: "bg-accent-indigo/10 text-accent-indigo",
    rose: "bg-accent-rose/10 text-accent-rose border border-accent-rose/20",
    green: "bg-accent-green/10 text-accent-green border border-accent-green/20",
    cyan: "bg-accent-cyan/10 text-accent-cyan",
    amber: "bg-accent-amber/10 text-accent-amber",
    purple: "bg-accent-purple/10 text-accent-purple",
  };

  return (
    <span className={`inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
