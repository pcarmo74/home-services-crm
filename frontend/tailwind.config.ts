import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        secondary: '#ec4899',
        dark: '#0f172a',
      },
    },
  },
  plugins: [],
}
export default config