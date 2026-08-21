import { useNavigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import BookOpen from '@mui/icons-material/Book'
import Layers from '@mui/icons-material/Layers'
import Search from '@mui/icons-material/Search'
import ReceiptLong from '@mui/icons-material/ReceiptLong'
import ErrorOutline from '@mui/icons-material/ErrorOutline'
import Lightbulb from '@mui/icons-material/Lightbulb'
import NoteAdd from '@mui/icons-material/NoteAdd'
import Home from '@mui/icons-material/Home'
import AccountBalance from '@mui/icons-material/AccountBalance'
import SmartToy from '@mui/icons-material/SmartToy'

import tokens from '../theme/tokens'

// 六层认知体系
const LAYERS = [
  { idx: '①', label: '投资哲学', path: '/principle?view=l1', icon: BookOpen },
  { idx: '②', label: '策略方法', path: '/methods', icon: Layers },
  { idx: '③', label: '标的研究', path: '/research/02097.HK', icon: Search },
  { idx: '④', label: '交易决策', path: '/trade', icon: ReceiptLong },
  { idx: '⑤', label: '复盘错误', path: '/review', icon: ErrorOutline },
  { idx: '⑥', label: '观察灵感', path: '/inspiration', icon: Lightbulb },
]

const CORE = [
  { label: '投资备忘录', path: '/memo', icon: NoteAdd },
  { label: '首页看板', path: '/', icon: Home },
]

const SYSTEM = [
  { label: '三层记忆', path: '/memory', icon: AccountBalance },
  { label: 'AI 协作协议', path: '/ai-protocol', icon: SmartToy },
]

function Section({ title, items, navigate, location }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 11, color: tokens.ink400, fontWeight: 600, px: 1.5, mb: 0.5, letterSpacing: 0.5 }}>
        {title}
      </Typography>
      {items.map((it) => {
        const active = location.pathname + location.search === it.path || location.pathname === it.path
        const Icon = it.icon
        return (
          <Box
            key={it.path}
            onClick={() => navigate(it.path)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              px: 1.5,
              py: 1,
              mx: 0.5,
              borderRadius: 1.5,
              cursor: 'pointer',
              bgcolor: active ? tokens.primarySoft : 'transparent',
              color: active ? tokens.primary : tokens.ink700,
              fontWeight: active ? 600 : 500,
              fontSize: 13.5,
              '&:hover': { bgcolor: active ? tokens.primarySoft : tokens.bgPage },
            }}
          >
            <Icon sx={{ fontSize: 18, color: active ? tokens.primary : tokens.ink500 }} />
            <span>{it.label}</span>
          </Box>
        )
      })}
    </Box>
  )
}

/**
 * 左侧导航（六层认知体系 + 核心工作台 + 记忆与体系）。
 */
export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Box
      sx={{
        width: 232,
        flexShrink: 0,
        bgcolor: tokens.surface,
        borderRight: `1px solid ${tokens.border}`,
        overflowY: 'auto',
        py: 2,
      }}
    >
      <Section title="六层认知体系" items={LAYERS} navigate={navigate} location={location} />
      <Section title="核心工作台" items={CORE} navigate={navigate} location={location} />
      <Section title="记忆与体系" items={SYSTEM} navigate={navigate} location={location} />
    </Box>
  )
}
