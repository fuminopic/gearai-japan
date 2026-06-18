import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#f4f8f4",
          100: "#e5eee5",
          200: "#cbdcca",
          500: "#5f8e65",
          700: "#14724e",
          900: "#1e3824"
        },
        trail: {
          50: "#f8f7f3",
          100: "#eeebe2",
          300: "#d3c7ad",
          600: "#836f49",
          800: "#4b3f2c"
        },
        ink: "#171a17"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(23, 26, 23, 0.08)"
      },
      fontFamily: {
        sans: [
          "Helvetica",
          "Arial",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        maru: [
          "\"Morisawa UD Shin Maru Pr6N L\"",
          "\"Morisawa UD Shin Maru Pr6N\"",
          "\"Morisawa UD新丸 Pr6N L\"",
          "\"Morisawa UD新丸 Pr6NL\"",
          "\"Hiragino Maru Gothic ProN\"",
          "\"Yu Gothic\"",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
