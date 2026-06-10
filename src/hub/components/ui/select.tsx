import { useState, type ReactNode } from "react";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  placeholder?: string;
  className?: string;
}

export function Select({ value, onChange, children, placeholder, className = "" }: SelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex h-9 w-full rounded-sm border border-surface-border bg-surface-elevated px-3 py-1 text-sm text-text-primary focus:outline-none focus:border-accent-indigo/50 focus:ring-1 focus:ring-accent-indigo/20 ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return <option value={value}>{children}</option>;
}
