import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        workspace: {
          bg: '#0d1117',
          sidebar: '#010409',
          border: '#30363d',
          hover: '#161b22',
          active: '#1f6feb',
          text: '#c9d1d9',
          muted: '#8b949e'
        }
      }
    },
  },
  plugins: [],
}
export default config