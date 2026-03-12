import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EBF4FB',
          100: '#D6E8F5',
          200: '#A8CCE8',
          300: '#7BAFD4',
          400: '#4A90C4',
          500: '#2E86AB',
          600: '#1E3A5F',
          700: '#172D4A',
          800: '#102035',
          900: '#081220',
        },
      },
    },
  },
  plugins: [],
}

export default config
