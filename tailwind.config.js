/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#ffffff",
          ink: "#0f172a",
          muted: "#64748b",
          primary: "#14b8a6",
          primaryDark: "#0d9488",
          accent: "#6366f1",
          accentDark: "#4f46e5",
        },
      },
      boxShadow: { card: "0 8px 24px rgba(15, 23, 42, 0.06)" },
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

