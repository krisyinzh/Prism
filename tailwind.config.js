/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        visualGray: '#4A5568',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
