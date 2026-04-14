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
        primary: '#0F4C81',
        mint: '#2DD4BF',
        'pri-c': '#d0e4ff',
        'mint-c': '#ccfbf1',
        surface: '#f8fafc',
        'text-base': '#1e293b',
        muted: '#475569',
        faint: '#94a3b8',
        err: '#dc2626',
        warn: '#d97706',
        ok: '#0d9488',
        glass: 'rgba(255,255,255,0.55)',
        'glass-b': 'rgba(255,255,255,0.42)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'app-gradient': 'linear-gradient(150deg, #dbeafe 0%, #e8f4fd 45%, #d4f6ef 100%)',
        'cta-gradient': 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)',
        'savings-gradient': 'linear-gradient(135deg, rgba(15,76,129,0.07) 0%, rgba(45,212,191,0.11) 100%)',
      },
      boxShadow: {
        'phone': '0 0 0 1px rgba(255,255,255,0.7), 0 0 0 10px rgba(255,255,255,0.18), 0 0 0 11px rgba(15,76,129,0.07), 0 60px 120px rgba(15,76,129,0.22), inset 0 1px 0 rgba(255,255,255,0.9)',
        'glass': '0 4px 20px rgba(15,76,129,0.06), inset 0 1px 0 rgba(255,255,255,0.6)',
        'btn': '0 8px 24px rgba(15,76,129,0.28), inset 0 1px 0 rgba(255,255,255,0.2)',
        'card': '0 4px 24px rgba(15,76,129,0.08), inset 0 1px 0 rgba(255,255,255,0.7)',
        'sheet': '0 -12px 40px rgba(15,76,129,0.1)',
        'mint': '0 4px 14px rgba(15,76,129,0.25)',
      },
      borderRadius: {
        'phone': '54px',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'spin-ring': 'spin 0.9s linear infinite',
        'counter-pop': 'counter-pop 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.4,0,0.2,1)',
        'stagger-in': 'stagger-in 0.4s ease forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.75)' },
        },
        'counter-pop': {
          '0%': { transform: 'scale(1)' },
          '45%': { transform: 'scale(1.07)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          from: { transform: 'translateY(105%)' },
          to: { transform: 'translateY(0)' },
        },
        'stagger-in': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
