import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#040404",
        panel: "rgba(17, 17, 17, 0.74)",
        line: "rgba(255, 255, 255, 0.12)",
        cyan: "#f4f4f5",
        violet: "#a1a1aa"
      },
      boxShadow: {
        glow: "0 0 42px rgba(255, 255, 255, 0.14)",
        violet: "0 0 46px rgba(255, 255, 255, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
