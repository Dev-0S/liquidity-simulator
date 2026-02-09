/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bid: '#22c55e',
        'bid-dim': '#16a34a',
        ask: '#ef4444',
        'ask-dim': '#dc2626',
        accent: '#3b82f6',
        'accent-dim': '#2563eb',
        violet: '#8b5cf6',
        surface: '#07080d',
        panel: '#0d1017',
        elevated: '#131620',
        border: '#1c2033',
        'border-bright': '#2a3050',
        muted: '#64748b',
        'text-primary': '#e2e8f0',
        'text-secondary': '#94a3b8',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 12px rgba(34,197,94,0.15)',
        'glow-red': '0 0 12px rgba(239,68,68,0.15)',
        'glow-blue': '0 0 15px rgba(59,130,246,0.2)',
        'glow-violet': '0 0 15px rgba(139,92,246,0.15)',
        'panel': '0 0 0 1px rgba(28,32,51,0.8), 0 4px 20px rgba(0,0,0,0.4)',
        'panel-hover': '0 0 0 1px rgba(59,130,246,0.3), 0 4px 20px rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'panel-gradient': 'linear-gradient(180deg, rgba(59,130,246,0.03) 0%, transparent 40%)',
        'card-shine': 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 50%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { opacity: '0.5' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
