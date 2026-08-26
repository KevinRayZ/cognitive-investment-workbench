import { useNavigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import tokens from '../theme/tokens'

const NAV = [
  { label: '首页', path: '/' },
  { label: '备忘录', path: '/memo' },
  { label: '原则', path: '/principle' },
  { label: '交易', path: '/trade' },
  { label: '复盘', path: '/review' },
  { label: '记忆', path: '/memory' },
]

/**
 * 顶部条（高 56）：精简导航（侧边栏已有完整导航，这里只放快捷入口）。
 */
export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <Box
      sx={{
        height: 52,
        flexShrink: 0,
        bgcolor: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
        display: 'flex',
        alignItems: 'center',
        px: 3,
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
        {NAV.map((item) => {
          const active = isActive(item.path)
          return (
            <Button
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                color: active ? tokens.primary : tokens.ink500,
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                px: 1.5,
                py: 0.5,
                borderRadius: tokens.radius.md,
                bgcolor: active ? tokens.primarySoft : 'transparent',
                transition: `all ${tokens.transition.fast}`,
                '&:hover': {
                  bgcolor: active ? tokens.primarySoft : tokens.bgPage,
                },
              }}
            >
              {item.label}
            </Button>
          )
        })}
      </Box>
    </Box>
  )
}
