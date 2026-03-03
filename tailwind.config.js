/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Bebas Neue", "sans-serif"],
        body: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        ink: {
          100: "#f5f7ff",
          300: "#b6bed8",
          400: "#9099b8",
        },
      },
      boxShadow: {
        card: "0 24px 35px rgba(0,0,0,.45)",
      },
    },
  },
  plugins: [],
};
