import { type ReactNode, type ButtonHTMLAttributes, type ReactElement, cloneElement } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "ghost";
  asChild?: boolean;
}

export function Button({ children, variant = "default", asChild, className = "", ...props }: ButtonProps) {
  const variants = {
    default:
      "bg-accent-indigo text-text-inverse hover:bg-accent-indigo/90",
    ghost: "hover:bg-surface-hover text-text-secondary hover:text-text-primary",
  };

  const classes = `inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${variants[variant]} ${className}`;

  if (asChild && children && typeof children === "object") {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, { className: `${child.props.className ?? ""} ${classes}`.trim() });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
