import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050608",
        panel: "rgba(13, 18, 28, 0.74)",
        line: "rgba(255, 255, 255, 0.12)",
        cyan: "#22d3ee",
        violet: "#8b5cf6"
      },
      boxShadow: {
        glow: "0 0 42px rgba(34, 211, 238, 0.18)",
        violet: "0 0 46px rgba(139, 92, 246, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
