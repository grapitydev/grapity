export function GrapityLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="logo-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path d="M7 24 L16 6 L25 24 L21 24 L16 14 L11 24 Z" fill="url(#logo-g)" />
      <circle cx="16" cy="24" r="2.5" fill="url(#logo-g)" />
    </svg>
  );
}

export function GrapityWordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="text-text-primary">grapity</span>{" "}
      <span className="text-text-secondary">Hub</span>
    </span>
  );
}
