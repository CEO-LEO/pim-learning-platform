/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pim-blue': '#2563eb',
        'pim-light-blue': '#3b82f6',
        'pim-sky': '#0ea5e9',
        'pim-sky-light': '#e0f2fe',
      },
    },
  },
  plugins: [],
}

