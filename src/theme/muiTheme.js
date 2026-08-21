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
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: tokens.radius.sm },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: { borderRadius: tokens.radius.md },
      },
    },
  },
})

export default muiTheme
