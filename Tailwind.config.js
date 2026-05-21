/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body: ["'DM Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: {
          50: "#f5f4f0",
          100: "#e8e5dc",
          200: "#cdc8b8",
          300: "#afa88e",
          400: "#958d72",
          500: "#847c62",
          600: "#716952",
          700: "#5c5443",
          800: "#4c4538",
          900: "#423b31",
          950: "#231f1a",
        },

        zinc: {
         400: "#a1a1aa",
        500: "#71717a",
        600: "#52525b",
        700: "#3f3f46",
        800: "#27272a",
         },
        cream: "#faf8f3",
        parchment: "#f0ede4",
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
        },
        ember: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },
        jade: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        rose: {
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
      },
    },
  },
  plugins: [],
};