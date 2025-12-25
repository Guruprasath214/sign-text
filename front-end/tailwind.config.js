/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4169E1',
        secondary: '#1e3a8a',
        accent: '#6B8DD6',
        beige: '#F5F5DC',
        'beige-dark': '#E8E8D0',
        'royal-blue': '#4169E1',
      }
    },
  },
  plugins: [],
}
