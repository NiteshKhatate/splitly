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
        "card-heading": ["1.125rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        amount: ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }],
        "section-heading": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        "large-amount": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "700" }],
        "page-heading": ["2rem", { lineHeight: "2.5rem", fontWeight: "700" }],
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
