import tokens from './src/theme/tokens'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // MUI provides its own reset via CssBaseline; disable Tailwind preflight to avoid conflicts.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        bgpage: tokens.bgPage,
        surface: tokens.surface,
        borderc: tokens.border,
        ink: {
          900: tokens.ink900,
          700: tokens.ink700,
          500: tokens.ink500,
          400: tokens.ink400,
        },
        primary: tokens.primary,
        'primary-soft': tokens.primarySoft,
        ai: tokens.ai,
        'ai-soft': tokens.aiSoft,
        warn: tokens.warn,
        'warn-soft': tokens.warnSoft,
        up: tokens.up,
        down: tokens.down,
        dark: tokens.dark,
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"Roboto Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,41,.06), 0 1px 2px rgba(15,23,41,.04)',
      },
    },
  },
  plugins: [],
}
