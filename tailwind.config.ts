import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        display: ['var(--font-display)', 'sans-serif'],
      },
      colors: {
        surface: {
          DEFAULT: '#0a0a0f',
          1: '#0f0f17',
          2: '#14141e',
          3: '#1a1a26',
          4: '#21212f',
        },
        accent: {
          cyan: '#00d4ff',
          green: '#00ff88',
          red: '#ff4466',
          amber: '#ffaa00',
          purple: '#9966ff',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          bright: 'rgba(255,255,255,0.12)',
        },
      },
      backgroundImage: {
        'glow-cyan': 'radial-gradient(ellipse at center, rgba(0,212,255,0.15) 0%, transparent 70%)',
        'glow-green': 'radial-gradient(ellipse at center, rgba(0,255,136,0.12) 0%, transparent 70%)',
        'grid': 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'ticker': 'ticker 20s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0,212,255,0.2)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(0,212,255,0.3)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      boxShadow: {
        'card': '0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)',
        'glow-cyan': '0 0 30px rgba(0,212,255,0.25)',
        'glow-green': '0 0 30px rgba(0,255,136,0.2)',
      },
    },
  },
  plugins: [],
}

export default config
