/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bricolage Grotesque"', '"Inter"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        // Growlocal identity: deep forest + lime growth accent. Distinct from anything else.
        canvas: {
          50: "#fbfdfb",
          100: "#f4f8f4",
          200: "#e8f0e8",
        },
        forest: {
          900: "#0b1a12",
          800: "#12281c",
          700: "#1b3a29",
          600: "#2a5540",
          500: "#3d7357",
        },
        lime: {
          DEFAULT: "#7ee23e",
          500: "#7ee23e",
          600: "#63c227",
          400: "#9bed6a",
          300: "#b8f394",
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
