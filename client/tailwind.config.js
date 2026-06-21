export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        heading: ["Cormorant Garamond", "serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        midnight: "#0d0d1a",
        indigo: "#13132b",
        card: "#1a1a35",
        lavender: "#c084fc",
        blush: "#f9a8d4",
        gold: "#fcd34d",
        "text-primary": "#f3e8ff",
        "text-muted": "#a78bfa",
        border: "#2e2b5f",
      },
    },
  },
  plugins: [],
};
