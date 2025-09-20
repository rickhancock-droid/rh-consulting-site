/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#ffffff",
          ink: "#0f172a",          // slate-900
          muted: "#64748b",        // slate-500
          primary: "#14b8a6",      // teal-500
          primaryDark: "#0d9488",  // teal-600
          accent: "#4f85ff",       // custom blue (brand-500)
          accentDark: "#3b6be6",   // brand-600
        },
      },
      boxShadow: {
        card: "0 8px 24px rgba(15, 23, 42, 0.06)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

