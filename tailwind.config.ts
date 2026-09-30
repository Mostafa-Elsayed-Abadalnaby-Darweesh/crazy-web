import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#2563EB", 50: "#EFF6FF", 100: "#DBEAFE", 500: "#3B82F6", 600: "#2563EB", 700: "#1D4ED8" },
        secondary: { DEFAULT: "#14B8A6", 50: "#F0FDFA", 100: "#CCFBF1", 600: "#0D9488" },
        ink: "#0F172A",
        canvas: "#F8FAFC",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
        float: "0 8px 24px rgba(15,23,42,0.12), 0 2px 6px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
