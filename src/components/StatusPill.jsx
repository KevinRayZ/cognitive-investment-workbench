import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import tokens, { TONE_COLORS } from '../theme/tokens'

/**
 * 状态标签（圆角矩形 8，保证长文案显示完整）。
 * @param {string} label 文案
 * @param {('primary'|'ai'|'warn'|'down'|'up'|'ink'|'neutral')} [tone] 语义色
 * @param {React.ReactNode} [dot] 前置小圆点（8×8 圆角方块，用于状态语义）
 */
export default function StatusPill({ label, tone = 'neutral', dot, size = 'md' }) {
  const c = TONE_COLORS[tone] || TONE_COLORS.neutral
  const pad = size === 'sm' ? '2px 8px' : '4px 11px'
  const fs = size === 'sm' ? 11 : 12
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: dot ? 0.75 : 0,
        bgcolor: c.bg,
        color: c.color,
        borderRadius: 0,
        px: pad,
        py: size === 'sm' ? 0 : 0.25,
        fontSize: fs,
        fontWeight: 600,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {dot && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: 2,
            bgcolor: c.color,
            flexShrink: 0,
          }}
        />
      )}
      <Typography component="span" sx={{ fontSize: fs, fontWeight: 600, color: 'inherit' }}>
        {label}
      </Typography>
    </Box>
  )
}

export { tokens }
