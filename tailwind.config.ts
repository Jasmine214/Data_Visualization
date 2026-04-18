import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        spotify: {
          ink: "#FFFFFF",
          muted: "#B3B3B3",
          green: "#1DB954",
          leaf: "#B8F251",
          mist: "#1DB954"
        },
        violet: {
          ink: "#21172C",
          deep: "#6E3FB8",
          mid: "#A276D8",
          soft: "#F1EAFB"
        }
      },
      boxShadow: {
        panel: "0 24px 70px rgba(0, 0, 0, 0.34)"
      }
    }
  },
  plugins: []
};

export default config;
