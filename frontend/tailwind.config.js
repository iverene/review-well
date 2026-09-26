/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Theme-aware tokens backed by RGB triplets in index.css
        // (:root = light, [data-theme='dark'], [data-theme='reading']).
        // The triplet form keeps Tailwind opacity modifiers working.
        'ink': 'rgb(var(--ink) / <alpha-value>)',
        'paper': 'rgb(var(--paper) / <alpha-value>)',
        'stone': 'rgb(var(--stone) / <alpha-value>)',
        'accent': 'rgb(var(--accent) / <alpha-value>)',
        'muted': 'rgb(var(--muted) / <alpha-value>)',
        'blush': 'rgb(var(--blush) / <alpha-value>)',
        'powder': 'rgb(var(--powder) / <alpha-value>)',
        'mint': 'rgb(var(--mint) / <alpha-value>)',
        'butter': 'rgb(var(--butter) / <alpha-value>)',
        'cream': 'rgb(var(--cream) / <alpha-value>)',
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
