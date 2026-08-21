import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import tokens, { TONE_COLORS, ID_TONE } from '../theme/tokens'

/**
 * 编号徽章：按前缀着色（IS 人类 / M 方法 ink / ERR 警示 / MEMO 人类）。
 * @param {string} id 形如 IS-2026-001
 * @param {('sm'|'md')} [size]
 */
export default function IdBadge({ id, size = 'md' }) {
  const prefix = (id || '').split('-')[0]
  const tone = ID_TONE[prefix] || 'neutral'
  const c = TONE_COLORS[tone] || TONE_COLORS.neutral
  const fs = size === 'sm' ? 11 : 12
  const px = size === 'sm' ? '6px 8px' : '7px 10px'
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        bgcolor: c.bg,
        color: c.color,
        borderRadius: 1.5,
        px,
        py: 0.25,
        fontFamily: '"Roboto Mono", monospace',
        fontVariantNumeric: 'tabular-nums',
        fontSize: fs,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {id}
    </Box>
  )
}
