import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#155EEF', 600: '#1E3A8A', 50: '#E6EEFF' },
        accent: { DEFAULT: '#00B3FF' },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        alt: ['"Source Sans 3"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
