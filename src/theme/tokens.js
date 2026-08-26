/**
 * 设计令牌（Design Tokens）—— 全项目唯一颜色 / 圆角 / 间距来源。
 * 所有组件、Tailwind 主题、MUI 主题均从此文件导入，禁止硬编码色值。
 * 语义：indigo = 人类 / teal = AI / amber = 警示 / 红 = 涨 / 绿 = 跌（中国股市惯例）。
 */

export const tokens = {
  // 中性色
  bgPage: '#F4F6FB',
  surface: '#FFFFFF',
  border: '#E8EBF0',
  ink900: '#0F1729', // 标题、主要文字
  ink700: '#33425A', // 正文、卡片内容
  ink500: '#64738C', // 次级文字、说明
  ink400: '#94A3B8', // 标签、占位、三级信息

  // 品牌色（人类 / Indigo）
  primary: '#2F54EB',
  primarySoft: '#EEEFFA',
  primaryGradient: 'linear-gradient(135deg, #2F54EB 0%, #4A6CF7 100%)',

  // AI 色（Teal）
  ai: '#0EA5A4',
  aiSoft: '#E6F7F6',
  aiGradient: 'linear-gradient(135deg, #0EA5A4 0%, #14B8B6 100%)',

  // 警示色（Amber）
  warn: '#F5A524',
  warnSoft: '#FFF6E5',
  warnGradient: 'linear-gradient(135deg, #F5A524 0%, #FFB845 100%)',

  // 金融语义色（红涨绿跌 · 中国惯例）
  up: '#E5484D', // 涨 / 盈利 / 正向
  down: '#15803D', // 跌 / 亏损 / 负向

  // 深色（免责声明条 / 边界红线条）
  dark: '#0F1729',

  // 圆角（小=4 接近直角 / 中=6 圆角矩形柔和 / 大=8 大卡片；刻意避免 ≥12 防止视觉椭圆感）
  radius: { sm: 4, md: 6, lg: 8, pill: 999 },

  // 间距
  gap: { sm: 8, md: 16, lg: 24 },

  // 内边距
  pad: { sm: 12, md: 16, lg: 24 },

  // 阴影（柔和层次，避免硬阴影）
  shadow: {
    xs: '0 1px 2px rgba(15, 23, 41, 0.04)',
    sm: '0 2px 8px rgba(15, 23, 41, 0.06)',
    md: '0 4px 16px rgba(15, 23, 41, 0.08)',
    lg: '0 8px 32px rgba(15, 23, 41, 0.10)',
    primary: '0 4px 12px rgba(47, 84, 235, 0.12)',
    ai: '0 4px 12px rgba(14, 165, 164, 0.12)',
    warn: '0 4px 12px rgba(245, 165, 36, 0.12)',
  },

  // 过渡
  transition: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    base: '0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

// ID 徽章配色（按前缀区分）
export const ID_TONE = {
  IS: 'primary',
  M: 'ink',
  ERR: 'warn',
  MEMO: 'primary',
}

// 状态胶囊常用配色映射
export const TONE_COLORS = {
  primary: { bg: tokens.primarySoft, color: tokens.primary },
  ai: { bg: tokens.aiSoft, color: tokens.ai },
  warn: { bg: tokens.warnSoft, color: '#9A6700' },
  down: { bg: '#E6F4EC', color: tokens.down },
  up: { bg: '#FDECEC', color: tokens.up },
  ink: { bg: '#EEF1F6', color: tokens.ink700 },
  neutral: { bg: '#EEF1F6', color: tokens.ink500 },
}

export default tokens
