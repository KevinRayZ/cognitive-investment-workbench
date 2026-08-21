import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Check from '@mui/icons-material/Check'

import tokens from '../theme/tokens'

/**
 * 决策前闸门 5 步横向 stepper。
 * 已完成 → 绿色 ✓；未通过 → amber 圆点 + !；首个未通过步骤高亮（当前步）。
 * @param {boolean[]} steps 5 步通过状态
 * @param {string[]} labels 5 步标签
 */
export default function GateStepper({ steps = [false, false, false, false, false], labels = [] }) {
  const current = steps.findIndex((s) => !s)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 0.5 }}>
      {steps.map((passed, i) => {
        const isCurrent = i === current
        const color = passed ? tokens.down : isCurrent ? tokens.warn : tokens.ink400
        return (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', flex: '1 1 0', minWidth: 150 }}>
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: passed ? tokens.down : 'transparent',
                border: `2px solid ${color}`,
                color,
                flexShrink: 0,
                fontWeight: 700,
                fontSize: 14,
                boxShadow: isCurrent ? `0 0 0 4px ${tokens.warnSoft}` : 'none',
              }}
            >
              {passed ? <Check sx={{ fontSize: 16 }} /> : '!'}
            </Box>
            <Box sx={{ ml: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? tokens.warn : passed ? tokens.down : tokens.ink500, whiteSpace: 'nowrap' }}>
                {labels[i]}
              </Typography>
              <Typography sx={{ fontSize: 11, color: passed ? tokens.down : tokens.ink400 }}>{passed ? '已通过' : isCurrent ? '阻塞中' : '未通过'}</Typography>
            </Box>
            {i < steps.length - 1 && <Box sx={{ flex: 1, height: 2, bgcolor: passed ? tokens.down : tokens.border, mx: 1, minWidth: 16 }} />}
          </Box>
        )
      })}
    </Box>
  )
}
