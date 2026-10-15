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
        // Growlocal identity: indigo-black neutral + a bold indigo/violet brand
        // accent. `emerald` is kept separate and reserved for real pass/fail
        // data semantics (checkmarks, grades, deltas) — brand color and
        // success color are not the same thing, even when both used to be green.
        canvas: {
          50: "#fbfaff",
          100: "#f5f3fc",
          200: "#eae6f7",
        },
        forest: {
          900: "#0e0b1f",
          800: "#171332",
          700: "#241d4d",
          600: "#362b6e",
          500: "#4c3d8f",
        },
        indigo: {
          DEFAULT: "#6366f1",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
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
        lift: "0 1px 2px rgba(11,26,18,0.04), 0 8px 24px rgba(11,26,18,0.06)",
        glow: "0 0 0 1px rgba(126,226,62,0.2), 0 12px 40px rgba(126,226,62,0.15)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
