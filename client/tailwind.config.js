export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: '#3B82F6',
        'brand-light': '#60A5FA',
        surface: '#111318',
        border: '#1e2029',
        dark: '#0d0f14',
        accent: '#6ee7b7',
      }
    }
  },
  plugins: [],
}
