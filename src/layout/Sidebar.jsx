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
import Forum from '@mui/icons-material/Forum'
import Settings from '@mui/icons-material/Settings'
import AccountTree from '@mui/icons-material/AccountTree'
import TrendingUp from '@mui/icons-material/TrendingUp'
import PieChart from '@mui/icons-material/PieChart'
import Dashboard from '@mui/icons-material/DashboardCustomize'
import SearchTwo from '@mui/icons-material/Search'
import ShieldCheck from '@mui/icons-material/Shield'

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

// 扩展工作台（决策闭环·七层框架）
const EXTENDED = [
  { label: '策略中心(L3/L4)', path: '/strategy', icon: Dashboard },
  { label: '评分引擎(L5/L6)', path: '/score-engine', icon: PieChart },
  { label: '基金管理', path: '/funds', icon: AccountTree },
  { label: '基金代码穿透分析', path: '/fund-analyze', icon: SearchTwo },
  { label: '行业观察', path: '/industry-watch', icon: TrendingUp },
]

const CORE = [
  { label: '首页看板', path: '/', icon: Home },
  { label: '投资备忘录', path: '/memo', icon: NoteAdd },
  { label: 'AI 对话', path: '/chat', icon: Forum },
]

const SYSTEM = [
  { label: '三层记忆', path: '/memory', icon: AccountBalance },
  { label: 'AI 协作协议', path: '/ai-protocol', icon: SmartToy },
  { label: '设置', path: '/settings', icon: Settings },
]

function Section({ title, items, navigate, location }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{
        fontSize: 10,
        color: tokens.ink400,
        fontWeight: 700,
        px: 1.5,
        mb: 0.5,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
      }}>
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
              py: 0.9,
              mx: 0.5,
              borderRadius: tokens.radius.md,
              cursor: 'pointer',
              bgcolor: active ? tokens.primarySoft : 'transparent',
              color: active ? tokens.primary : tokens.ink700,
              fontWeight: active ? 700 : 500,
              fontSize: 13.5,
              position: 'relative',
              transition: `all ${tokens.transition.fast}`,
              '&:hover': {
                bgcolor: active ? tokens.primarySoft : tokens.bgPage,
                transform: 'translateX(2px)',
              },
              '&::before': active ? {
                content: '""',
                position: 'absolute',
                left: -2,
                top: 6,
                bottom: 6,
                width: 3,
                bgcolor: tokens.primary,
                borderRadius: 2,
              } : {},
            }}
          >
            <Icon sx={{ fontSize: 18, color: active ? tokens.primary : tokens.ink500, transition: `color ${tokens.transition.fast}` }} />
            <span>{it.label}</span>
          </Box>
        )
      })}
    </Box>
  )
}

/**
 * 左侧导航（品牌区 + 六层认知体系 + 扩展工作台 + 核心工作台 + 记忆与体系）。
 */
export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Box
      sx={{
        width: 236,
        flexShrink: 0,
        bgcolor: tokens.surface,
        borderRight: `1px solid ${tokens.border}`,
        overflowY: 'auto',
        py: 2,
      }}
    >
      {/* 品牌区 */}
      <Box
        onClick={() => navigate('/')}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          px: 2,
          pb: 2,
          mb: 1,
          borderBottom: `1px solid ${tokens.border}`,
          cursor: 'pointer',
        }}
      >
        <Box sx={{
          width: 32,
          height: 32,
          borderRadius: tokens.radius.md,
          background: tokens.primaryGradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: tokens.shadow.primary,
        }}>
          <ShieldCheck sx={{ color: '#fff', fontSize: 18 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, color: tokens.ink900, fontSize: 14, lineHeight: 1.2 }}>认知投资</Typography>
          <Typography sx={{ fontSize: 10, color: tokens.ink400, letterSpacing: '0.5px' }}>v2.7.0</Typography>
        </Box>
      </Box>

      <Section title="六层认知体系" items={LAYERS} navigate={navigate} location={location} />
      <Section title="扩展工作台" items={EXTENDED} navigate={navigate} location={location} />
      <Section title="核心工作台" items={CORE} navigate={navigate} location={location} />
      <Section title="记忆与体系" items={SYSTEM} navigate={navigate} location={location} />
    </Box>
  )
}
