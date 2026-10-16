/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // Growlocal identity: warm off-white canvas, deep green-black ink and one
        // bright green brand accent. The accent keeps the token name `indigo` so
        // every page restyles from here; 500 and lighter are for fills, borders
        // and dark backgrounds, 600 and darker are for text on light backgrounds
        // (AA contrast). `emerald` stays reserved for pass/fail data.
        canvas: {
          50: "#fbfaf6",
          100: "#f3f2ea",
          200: "#e6e5da",
        },
        forest: {
          900: "#0a1f16",
          800: "#10291e",
          700: "#173628",
          600: "#22493a",
          500: "#2f604c",
        },
        sage: {
          50: "#f1f5ef",
          100: "#e4ece0",
        },
        indigo: {
          DEFAULT: "#22c55e",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#15803d",
          700: "#166534",
          800: "#14532d",
        },
        brand: {
          DEFAULT: "#2fdd6a",
          hover: "#25c95d",
          ink: "#052e14",
        },
        emerald: {
          DEFAULT: "#10b981",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        sky: {
          500: "#38bdf8",
          400: "#7dd3fc",
        },
        amber: {
          500: "#f59e0b",
        },
        rose: {
          500: "#f43f5e",
        },
        violet: {
          500: "#a78bfa",
          600: "#8b5cf6",
        },
      },
      boxShadow: {
        lift: "0 1px 2px rgba(10,31,22,0.04), 0 8px 24px rgba(10,31,22,0.06)",
        glow: "0 0 0 1px rgba(47,221,106,0.25), 0 12px 40px rgba(47,221,106,0.18)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
