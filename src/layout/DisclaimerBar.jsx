import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

import tokens from '../theme/tokens'

/**
 * 底部深色「人类最终负责」声明条（高 52，九屏统一）。
 */
export default function DisclaimerBar() {
  return (
    <Box
      sx={{
        height: 52,
        flexShrink: 0,
        bgcolor: tokens.dark,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 3,
      }}
    >
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: 6,
          bgcolor: tokens.warn,
          color: tokens.dark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 15,
          flexShrink: 0,
        }}
      >
        !
      </Box>
      <Typography sx={{ fontSize: 13, lineHeight: 1.4 }}>
        人类最终负责：AI 可给出方向与仓位建议（建议级，仅供决策参考），但无自动执行权；本工作台所有投资决策与交易执行均由你做出，边界外决策必须人工确认。
      </Typography>
    </Box>
  )
}
