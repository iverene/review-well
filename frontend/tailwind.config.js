/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ink': '#604a3a',
        'paper': '#fff7e8',
        'stone': '#eadfce',
        'accent': '#c96a83',
        'muted': '#8b7768',
        'blush': '#f6c6d2',
        'powder': '#c9e6f2',
        'mint': '#cde8d2',
        'butter': '#f9e4a8',
      },
      fontFamily: {
        'sans': ['"Nunito"', 'sans-serif'],
        'display': ['"Fredoka"', 'sans-serif'],
        'serif': ['"Fredoka"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'club': '16px',
        'soft': '12px',
      },
    },
  },
  plugins: [],
}
