import { createTheme } from '@mui/material/styles'
import tokens from './tokens'

/**
 * MUI 主题 —— 颜色全部映射自 tokens.js，与 Tailwind / CSS 变量同源。
 * 自定义键（ai / warn / up / down）供 sx 通过 palette 引用，保证语义一致。
 */
export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: tokens.bgPage,
      paper: tokens.surface,
    },
    text: {
      primary: tokens.ink900,
      secondary: tokens.ink700,
      disabled: tokens.ink400,
    },
    primary: { main: tokens.primary },
    ai: { main: tokens.ai },
    warn: { main: tokens.warn },
    up: { main: tokens.up },
    down: { main: tokens.down },
    divider: tokens.border,
  },
  typography: {
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 14,
    h1: { fontFamily: '"Noto Sans SC", sans-serif' },
    h2: { fontFamily: '"Noto Sans SC", sans-serif' },
    h3: { fontFamily: '"Noto Sans SC", sans-serif' },
    h4: { fontFamily: '"Noto Sans SC", sans-serif' },
    h5: { fontFamily: '"Noto Sans SC", sans-serif' },
    h6: { fontFamily: '"Noto Sans SC", sans-serif' },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: tokens.radius.md,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.bgPage,
          color: tokens.ink700,
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        '*::-webkit-scrollbar': { width: 6, height: 6 },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: tokens.ink400,
          borderRadius: 3,
          '&:hover': { background: tokens.ink500 },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.md,
          textTransform: 'none',
          fontWeight: 600,
          transition: `all ${tokens.transition.base}`,
        },
        contained: {
          boxShadow: tokens.shadow.xs,
          '&:hover': { boxShadow: tokens.shadow.sm, transform: 'translateY(-1px)' },
        },
        outlined: {
          '&:hover': { transform: 'translateY(-1px)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: tokens.radius.lg },
      },
      defaultProps: { elevation: 0 },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: tokens.radius.lg,
          boxShadow: tokens.shadow.xs,
          transition: `box-shadow ${tokens.transition.base}, transform ${tokens.transition.base}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
        outlined: { borderWidth: 1 },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: tokens.radius.md,
            transition: `all ${tokens.transition.fast}`,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 12,
          borderRadius: tokens.radius.sm,
          padding: '4px 8px',
        },
      },
    },
  },
})

export default muiTheme
