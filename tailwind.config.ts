import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/hub/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "var(--surface-base)",
          elevated: "var(--surface-elevated)",
          hover: "var(--surface-hover)",
          border: "var(--surface-border)",
          code: "var(--surface-code)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          indigo: "var(--accent-indigo)",
          "indigo-light": "var(--accent-indigo-light)",
          "indigo-muted": "var(--accent-indigo-muted)",
          blue: "var(--accent-blue)",
          cyan: "var(--accent-cyan)",
          green: "var(--accent-green)",
          rose: "var(--accent-rose)",
          amber: "var(--accent-amber)",
          purple: "var(--accent-purple)",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
