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
        minWidth: 150,
        bgcolor: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: tokens.radius.lg,
        boxShadow: tokens.shadow.xs,
        p: 2,
        transition: `all ${tokens.transition.base}`,
        '&:hover': {
          boxShadow: tokens.shadow.sm,
          transform: 'translateY(-2px)',
          borderColor: accent || tokens.border,
        },
        position: 'relative',
        overflow: 'hidden',
        '&::before': accent ? {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent}, ${accent}DD)`,
        } : {},
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Typography sx={{
          fontSize: 11,
          color: tokens.ink400,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>{label}</Typography>
        <Box sx={{ opacity: 0.6 }}>{icon}</Box>
      </Box>
      <Typography
        sx={{
          fontFamily: '"Roboto Mono", monospace',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 24,
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
            fontWeight: 600,
          }}
        >
          {delta.text}
        </Typography>
      )}
    </Box>
  )
}
