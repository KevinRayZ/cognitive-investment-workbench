import { useNavigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import ShieldCheck from '@mui/icons-material/Shield'

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
 * 顶部条（高 56）：品牌名 + 6 项主导航（当前项高亮 primary）。
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
        height: 56,
        flexShrink: 0,
        bgcolor: tokens.surface,
        borderBottom: `1px solid ${tokens.border}`,
        display: 'flex',
        alignItems: 'center',
        px: 3,
        gap: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
        <ShieldCheck sx={{ color: tokens.primary, fontSize: 22 }} />
        <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 16 }}>认知投资工作台</Typography>
      </Box>

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
                fontSize: 14,
                px: 2,
                position: 'relative',
                '&::after': active
                  ? {
                      content: '""',
                      position: 'absolute',
                      bottom: 6,
                      left: 16,
                      right: 16,
                      height: 2,
                      bgcolor: tokens.primary,
                      borderRadius: 2,
                    }
                  : {},
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
