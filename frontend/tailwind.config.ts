import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0b0f19',
          surface: '#111827',
          card: '#151f32',
          border: '#1f2937',
          cyan: '#06b6d4',
          red: '#ef4444',
          green: '#22c55e',
          warning: '#f59e0b',
          muted: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.35)',
        'glow-red': '0 0 15px rgba(239, 68, 68, 0.35)',
        'glow-green': '0 0 15px rgba(34, 197, 94, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
