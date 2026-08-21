import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import AlertTriangle from '@mui/icons-material/WarningAmber'
import Trash from '@mui/icons-material/DeleteOutline'
import ArrowForward from '@mui/icons-material/ArrowForward'
import CheckCircle from '@mui/icons-material/CheckCircleOutline'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import KpiCard from '../components/KpiCard'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'

const LAYER_CARDS = [
  { idx: '①', title: '投资哲学', desc: '宪法级不可违背的硬规则', path: '/principle?view=l1', tone: 'primary' },
  { idx: '②', title: '策略方法', desc: '选股 / 估值 / 仓位 / 风控', path: '/methods', tone: 'ink' },
  { idx: '③', title: '标的研究', desc: '个股 / 行业标准化档案', path: '/research/02097.HK', tone: 'ai' },
  { idx: '④', title: '交易决策', desc: '每笔买卖完整记录', path: '/trade', tone: 'primary' },
  { idx: '⑤', title: '复盘错误', desc: '交易复盘 + 错误库', path: '/review', tone: 'warn' },
  { idx: '⑥', title: '观察灵感', desc: '宏观 / 突发 / 灵感池', path: '/inspiration', tone: 'ai' },
]

const HUMAN_LOOP = ['目标设定', '感知读资料', '分析对话', '决策', '执行', '复盘写回']
const AI_LOOP = ['读取记忆', '生成建议', '标注来源', '等待确认', '回灌记忆']

function LoopStep({ label, color, last }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box
        sx={{
          px: 1.25,
          py: 0.5,
          borderRadius: 1.5,
          fontSize: 12,
          fontWeight: 600,
          bgcolor: color,
          color: '#fff',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </Box>
      {!last && <ArrowForward sx={{ fontSize: 14, color: tokens.ink400 }} />}
    </Box>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const kpis = useStore((s) => s.getKpis())
  const todo = useStore((s) => s.getTodolist())
  const recent = useStore((s) => s.getRecentMemos())
  const clearSamples = useStore((s) => s.clearSamples)

  const boundary = todo.find((t) => t.id === 'boundary')

  const handleClear = () => {
    if (window.confirm('确定清空全部示例数据？仅删除 isSample 标记的记录，你的新增内容将保留。')) {
      clearSamples()
    }
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="全局看板"
        title="工作台首页"
        subtitle="六层认知体系 · 三层记忆 · 双环操作系统 的总览入口"
        actions={
          <Button variant="outlined" color="inherit" startIcon={<Trash />} onClick={handleClear} sx={{ color: tokens.ink500, borderColor: tokens.border }}>
            清空示例
          </Button>
        }
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 今天要处理 */}
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>今天要处理</Typography>
          {todo.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 2,
                borderRadius: tokens.radius.md,
                bgcolor: '#E6F4EC',
                color: tokens.down,
                fontSize: 13,
              }}
            >
              <CheckCircle sx={{ fontSize: 18 }} /> 全部处理完毕，暂无待办事项。
            </Box>
          ) : (
            <Stack divider={<Divider />} sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
              {todo.map((t) => (
                <Box
                  key={t.id}
                  onClick={() => navigate(t.route)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: tokens.bgPage } }}
                >
                  <StatusPill label={t.type} tone={t.tone} />
                  <Typography sx={{ flex: 1, fontSize: 13.5, color: tokens.ink700 }}>{t.label}</Typography>
                  <ArrowForward sx={{ fontSize: 16, color: tokens.ink400 }} />
                </Box>
              ))}
            </Stack>
          )}
        </Box>

        {/* KPI 行 */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <KpiCard label="今日洞察" value={kpis.insights} accent={tokens.primary} />
          <KpiCard label="待处理闸门" value={kpis.pendingGates} accent={kpis.pendingGates ? tokens.warn : tokens.ink900} />
          <KpiCard label="本月交易" value={kpis.monthTrades} />
          <KpiCard label="记忆版本" value={kpis.memoryVersion} accent={tokens.ai} />
        </Box>

        {/* 六层认知体系卡片 */}
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>六层认知体系</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {LAYER_CARDS.map((c) => (
              <Box
                key={c.idx}
                onClick={() => navigate(c.path)}
                sx={{
                  p: 2,
                  borderRadius: tokens.radius.md,
                  bgcolor: tokens.surface,
                  border: `1px solid ${tokens.border}`,
                  boxShadow: '0 1px 3px rgba(15,23,41,.06)',
                  cursor: 'pointer',
                  '&:hover': { borderColor: tokens.primary },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 1.5,
                      bgcolor: c.tone === 'ai' ? tokens.aiSoft : c.tone === 'warn' ? tokens.warnSoft : tokens.primarySoft,
                      color: c.tone === 'ai' ? tokens.ai : c.tone === 'warn' ? tokens.warn : tokens.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {c.idx}
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 15 }}>{c.title}</Typography>
                </Box>
                <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>{c.desc}</Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* 双环操作系统 */}
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>双环操作系统</Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1, p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.primary, mb: 1 }}>人类环（6 步）</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center">
                {HUMAN_LOOP.map((s, i) => (
                  <LoopStep key={s} label={s} color={tokens.primary} last={i === HUMAN_LOOP.length - 1} />
                ))}
              </Stack>
            </Box>
            <Box sx={{ flex: 1, p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ai, mb: 1 }}>AI 环（5 步）— 不跨过执行/交易</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center">
                {AI_LOOP.map((s, i) => (
                  <LoopStep key={s} label={s} color={tokens.ai} last={i === AI_LOOP.length - 1} />
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>

        {/* 异常预警条 */}
        {boundary && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.warnSoft, color: '#9A6700', fontSize: 13.5 }}>
            <AlertTriangle sx={{ fontSize: 20, color: tokens.warn }} />
            <span>检测到 {boundary.count} 笔边界外交易，须人工复核后方可解除警告态。</span>
          </Box>
        )}

        {/* 最近备忘录 */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.ink900 }}>最近备忘录</Typography>
            <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/memo')} sx={{ color: tokens.primary }}>
              查看全部
            </Button>
          </Box>
          <Stack divider={<Divider />} sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
            {recent.map((m) => (
              <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
                <IdBadge id={m.id} />
                <Typography sx={{ flex: 1, fontSize: 13.5, color: tokens.ink700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.targetName} · {m.direction}
                </Typography>
                <StatusPill label={m.status} tone={m.status === '已决策' || m.status === '已执行' ? 'down' : 'neutral'} />
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
