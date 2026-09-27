/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ogene: {
          50: "#fafaf9",
          100: "#f5f5f3",
          200: "#e7e5e0",
          300: "#d9d6ce",
          400: "#bdb6ac",
          500: "#9d9484",
          600: "#7a7363",
          700: "#6b6355",
          800: "#534d46",
          900: "#3d3935",
        },
        brand: {
          orange: "#ea580c", // approximate match for the design
          dark: "#1c1917"
        }
        // NOTE: this project runs Tailwind v4, which reads its theme from the
        // `@theme` block in src/index.css, not from this file — this config
        // is not wired in via an `@config` directive anywhere. The ogene-*
        // shades above don't even match the ones actually in effect
        // (src/index.css defines its own, different ogene-* values). Add new
        // colors to src/index.css's @theme block, not here.
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
