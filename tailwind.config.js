/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F172A',
          'navy-light': '#1E293B',
          'navy-dark': '#020617',
          gold: '#C5A880',
          'gold-hover': '#D4AF37',
        },
        egypt: {
          red: '#CE1126',
          black: '#000000',
          gold: '#C0930C',
        },
      },
      fontFamily: {
        sans: ['var(--font-cairo)', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
