import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff8ff", 100: "#dbeeff", 500: "#2583c5",
          600: "#176ba8", 700: "#155889", 900: "#123b5b"
        }
      },
      boxShadow: { soft: "0 12px 40px rgba(15, 42, 70, 0.08)" }
    },
  },
  plugins: [],
};
export default config;
