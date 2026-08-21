import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import tokens from '../theme/tokens'
import StatusPill from './StatusPill'

/**
 * 边界红线提示条（交易页整宽深色条）。
 * 含「不可逾越」标签，强调 AI 无交易决策权、边界外记录须人工复核。
 */
export default function BoundaryAlert({ children }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        bgcolor: tokens.dark,
        color: '#FFFFFF',
        borderRadius: tokens.radius.md,
        border: `1px solid ${tokens.warn}`,
        p: 2,
      }}
    >
      <StatusPill label="不可逾越" tone="warn" />
      <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>{children}</Typography>
    </Box>
  )
}
