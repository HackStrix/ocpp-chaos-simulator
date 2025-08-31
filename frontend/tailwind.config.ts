import type { Config } from 'tailwindcss'
import path from 'path'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './.next/**/*.js',
  ],
  safelist: [
    'bg-gray-50', 'text-gray-900', 'bg-white', 'shadow-sm', 
    'border-b', 'text-xl', 'font-bold', 'h-16', 'max-w-7xl'
  ],
  theme: {
    extend: {
      colors: {
        // OCPP Simulator theme
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe', 
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
}

export default config
