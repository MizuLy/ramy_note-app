/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class", '[data-theme="black"]'],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "rgb(var(--color-white) / <alpha-value>)",
        black: "rgb(var(--color-black) / <alpha-value>)",
        zinc: {
          950: "rgb(var(--color-zinc-950) / <alpha-value>)",
          900: "rgb(var(--color-zinc-900) / <alpha-value>)",
          800: "rgb(var(--color-zinc-800) / <alpha-value>)",
          700: "rgb(var(--color-zinc-700) / <alpha-value>)",
          500: "rgb(var(--color-zinc-500) / <alpha-value>)",
          400: "rgb(var(--color-zinc-400) / <alpha-value>)",
          200: "rgb(var(--color-zinc-200) / <alpha-value>)",
          100: "rgb(var(--color-zinc-100) / <alpha-value>)",
        },
      },
      fontFamily: {
        belanosima: ["Belanosima", "sans-serif"],
        instrumentsans: ["Instrument Sans", "sans-serif"],
        josefinsans: ["Josefin Sans", "sans-serif"],
        notokhmer: ["Noto Sans Khmer", "sans-serif"],
        comfortaa: ["Comfortaa", "sans-serif"],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark", "black"],
  },
};
