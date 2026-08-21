import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import tokens, { TONE_COLORS } from '../theme/tokens'

const TONE = {
  primary: { bg: tokens.primarySoft, color: tokens.primary, solid: tokens.primary },
  warn: { bg: tokens.warnSoft, color: '#9A6700', solid: tokens.warn },
  ai: { bg: tokens.aiSoft, color: tokens.ai, solid: tokens.ai },
}

/**
 * 三层记忆概览卡（L1 / L2 / L3）。
 * @param {string} title 层名
 * @param {string[]} metrics 指标文本
 * @param {('primary'|'warn'|'ai')} tone 语义色
 */
export default function MemoryLayerCard({ title, metrics = [], tone = 'primary' }) {
  const c = TONE[tone] || TONE.primary
  return (
    <Box sx={{ flex: 1, minWidth: 220, p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderTop: `4px solid ${c.solid}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>{title[0]}</Box>
        <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 15 }}>{title}</Typography>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
        {metrics.map((m, i) => (
          <Box key={i} sx={{ px: 1.25, py: 0.5, borderRadius: 1.5, bgcolor: tokens.bgPage, fontSize: 12.5, color: tokens.ink700, border: `1px solid ${tokens.border}` }}>
            {m}
          </Box>
        ))}
      </Box>
    </Box>
  )
}
