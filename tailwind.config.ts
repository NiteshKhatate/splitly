import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-muted": "var(--surface-muted)",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",
        border: "var(--border)",
        primary: "var(--primary)",
        "primary-hover": "var(--primary-hover)",
        "primary-subtle": "var(--primary-subtle)",
        success: "var(--success)",
        "success-subtle": "var(--success-subtle)",
        warning: "var(--warning)",
        "warning-subtle": "var(--warning-subtle)",
        danger: "var(--danger)",
        "danger-subtle": "var(--danger-subtle)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
      },
      fontSize: {
        caption: ["0.75rem", { lineHeight: "1rem" }],
        label: ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }],
        secondary: ["0.875rem", { lineHeight: "1.25rem" }],
        body: ["1rem", { lineHeight: "1.5rem" }],
        "card-heading": ["clamp(1.0625rem, 1rem + 0.2vw, 1.125rem)", { lineHeight: "1.5", fontWeight: "600" }],
        amount: ["clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)", { lineHeight: "1.4", fontWeight: "600" }],
        "section-heading": ["clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)", { lineHeight: "1.35", fontWeight: "600" }],
        "large-amount": ["clamp(1.5rem, 1.35rem + 0.65vw, 1.75rem)", { lineHeight: "1.25", fontWeight: "700" }],
        "page-heading": ["clamp(1.75rem, 1.6rem + 0.65vw, 2rem)", { lineHeight: "1.2", fontWeight: "700" }],
      },
      borderRadius: {
        card: "0.75rem",
        control: "0.5rem",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
