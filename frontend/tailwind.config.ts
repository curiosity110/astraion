import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          glow: 'hsl(var(--primary-glow))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        accent: 'hsl(var(--accent))',
        success: 'hsl(142 72% 29%)',
        warning: 'hsl(38 92% 50%)',
        danger: 'hsl(0 84% 60%)',
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
