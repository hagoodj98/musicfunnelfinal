import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
   prefix: "tw-",
  theme: {
    extend: {
      
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'primary': '#167888',
        'secondary': '#EF4C12',
        'lighterblue': 'rgb(1, 10, 38, 0.8)'
      },
      backgroundImage : {
        "me": "url('/public/IMG_1856(1).jpg)"
      }
    },
  },
  plugins: [],
} satisfies Config;
