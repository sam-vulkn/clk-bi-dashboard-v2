import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        clk: {
          dark: "#041224",
          red: "#E62800",
          bg: "#F6F9FE",
          text: "#353535",
          "gray-light": "#E5E7E9",
          "gray-medium": "#CCD1D3",
          yellow: "#F9B233",
        },
      },
      fontFamily: {
        lato: ["Lato", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
