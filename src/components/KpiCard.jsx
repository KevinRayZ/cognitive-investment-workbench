import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import tokens from '../theme/tokens'

/**
 * KPI 卡片：label(ink-400) + value(Roboto Mono Bold) + delta（涨红跌绿）。
 * @param {string} label
 * @param {React.ReactNode} value 主数值
 * @param {{text:string, dir:'up'|'down'} } [delta]
 * @param {React.ReactNode} [icon]
 * @param {string} [accent] value 颜色（默认 ink-900）
 */
export default function KpiCard({ label, value, delta, icon, accent }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 160,
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radius.md,
        boxShadow: '0 1px 3px rgba(15,23,41,.06)',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>{label}</Typography>
        {icon}
      </Box>
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 22,
          fontWeight: 700,
          color: accent || tokens.ink900,
          mt: 1,
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>
      {delta && (
        <Typography
          sx={{
            fontFamily: '"Roboto Mono", monospace',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 12,
            color: delta.dir === 'up' ? tokens.up : tokens.down,
            mt: 0.5,
          }}
        >
          {delta.text}
        </Typography>
      )}
    </Box>
  )
}
