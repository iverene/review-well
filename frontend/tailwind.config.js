/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ink': '#1a1a1a',
        'paper': '#fafaf9',
        'stone': '#e5e5e5',
        'accent': '#dc2626',
        'muted': '#737373',
      },
      fontFamily: {
        'sans': ['"Plus Jakarta Sans"', 'sans-serif'],
        'serif': ['"Newsreader"', 'serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'none': '0',
        'sharp': '2px',
      },
    },
  },
  plugins: [],
}
