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
        'page': 'rgb(var(--page) / <alpha-value>)',
        'line': 'rgb(var(--line) / <alpha-value>)',
        'ink': 'rgb(var(--ink) / <alpha-value>)',
        'paper': 'rgb(var(--paper) / <alpha-value>)',
        'stone': 'rgb(var(--stone) / <alpha-value>)',
        'accent': 'rgb(var(--accent) / <alpha-value>)',
        'muted': 'rgb(var(--muted) / <alpha-value>)',
        'blush': 'rgb(var(--blush) / <alpha-value>)',
        'peach': 'rgb(var(--peach) / <alpha-value>)',
        'powder': 'rgb(var(--powder) / <alpha-value>)',
        'mint': 'rgb(var(--mint) / <alpha-value>)',
        'butter': 'rgb(var(--butter) / <alpha-value>)',
        'cream': 'rgb(var(--cream) / <alpha-value>)',
      },
      fontFamily: {
        'sans': ['"DM Sans"', 'system-ui', 'sans-serif'],
        'display': ['"Outfit"', 'system-ui', 'sans-serif'],
        'serif': ['"Outfit"', 'system-ui', 'sans-serif'],
        'mono': ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'club': '26px',
        'soft': '16px',
      },
      boxShadow: {
        // Soft Pop depth: blurred, Berry-tinted, never offset.
        'soft': '0 8px 24px rgb(var(--accent) / 0.10)',
        'soft-sm': '0 3px 10px rgb(var(--accent) / 0.10)',
        'float': '0 12px 32px rgb(var(--ink) / 0.16)',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
