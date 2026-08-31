import { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import AutoGraph from '@mui/icons-material/AutoGraph'
import Schedule from '@mui/icons-material/ScheduleOutlined'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import CircleFeedSection from '../components/CircleFeedSection'
import AssetTargetAdvice from '../components/AssetTargetAdvice'
import { CIRCLE } from '../lib/circleFeed'
import { useStore } from '../store/useStore'
import { deriveHoldings } from '../utils/dashboard'

/**
 * 日度市场动态简报（应用逻辑完善 §3.4 C4 前半）——
 * 宏观快照 + 指数/广度 + 当日事件 + 触发条件命中列表。
 * 定时调度（§3.4·P3 scheduler）后置，当前提供「手动生成本日简报」占位入口。
 */
export default function DailyBrief() {
  const dailyBriefs = useStore((s) => s.dailyBriefs) || []
  const create = useStore((s) => s.create)
  const targets = useStore((s) => s.targets) || []
  const trades = useStore((s) => s.trades) || []
  const phase = useStore((s) => s.dashboard?.marketClock?.phase) || '—'
  const targetStates = useStore((s) => s.targetStates) || []
  const remove = useStore((s) => s.remove)

  // 18:00 自动提取存档（scripts/circle-daily.mjs 由 Windows 计划任务每天 18:00 运行，写入 public/circle-daily.json）
  const [archive, setArchive] = useState(null)
  useEffect(() => {
    let alive = true
    fetch('/circle-daily.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j && j.date) setArchive(j) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  const todayIso = new Date().toISOString().slice(0, 10)
  const todayLocal = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
  const archivedToday = archive && (archive.date === todayLocal || archive.date === todayIso)

  const generate = () => {
    const { holdings } = deriveHoldings(trades, targets, {})
    const today = new Date().toISOString().slice(0, 10)
    const triggered = targetStates
      .filter((ts) => (ts.triggers || []).some((t) => t.status === '触发'))
      .map((ts) => ({ targetId: ts.targetId, condition: ts.triggers.find((t) => t.status === '触发')?.condition || '', action: ts.direction }))
    const rec = {
      date: today,
      macro: { phase, confidence: 0, keyIndicators: ['PMI', 'CPI', '社融'] },
      market: { indices: holdings.filter((h) => h.code && !/^cash$/i.test(h.code)).map((h) => ({ name: h.name, px: h.price, chg: h.changePct ?? null })), breadth: `${holdings.length} 个持仓标的`, fundFlow: '' },
      events: [],
      triggered,
      updatedAt: new Date().toISOString(),
    }
    create('dailyBriefs', rec)
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台 / 日报周报月报"
        title="日度市场动态简报"
        subtitle="宏观快照 · 指数/资金 · 当日事件 · 触发条件命中（核心）"
        actions={<Button variant="contained" startIcon={<AutoGraph />} onClick={generate} sx={{ bgcolor: tokens.primary }}>生成本日简报（占位）</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: archivedToday ? tokens.aiSoft : tokens.warnSoft, border: `1px solid ${tokens.border}`, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Schedule sx={{ fontSize: 17, color: archivedToday ? tokens.ai : tokens.warn }} />
          <Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>
            {archivedToday
              ? `今日市场动态已自动提取存档（${archive.count} 条，来源：张湧的小密圈 · 每天 18:00 计划任务）`
              : '今日暂无自动存档（Windows 计划任务 CIW_CircleDaily_1800 每天 18:00 自动提取当天市场动态）'}
          </Typography>
        </Box>

        <CircleFeedSection
          title="市场动态分析（近三个交易日）"
          subtitle="张湧的小密圈 · 刘铭 每日市场跟踪，当日帖自动高亮；超出三个交易日的数据不展示"
          tagId={CIRCLE.tags.daily}
          rows={15}
          scope="trade3"
          showTrend
          emptyHint="近三个交易日暂无圈子分析帖。"
        />

        {dailyBriefs.length === 0 ? (
          <Card sx={{ p: 4, borderRadius: tokens.radius.md, border: `1px dashed ${tokens.border}` }}>
            <Typography sx={{ color: tokens.ink400, textAlign: 'center' }}>暂无日度简报。</Typography>
          </Card>
        ) : (
          [...dailyBriefs].reverse().map((b) => (
            <Card key={b.id} sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md }}>
              <CardContent sx={{ p: 2.25 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                  <StatusPill label={b.date} tone="primary" />
                  <Chip size="small" label={`宏观：${b.macro?.phase || '—'}`} variant="outlined" />
                  <Typography sx={{ ml: 'auto', fontSize: 11.5, color: tokens.ink400 }}>更新 {b.updatedAt?.slice(11, 16) || ''}</Typography>
                </Box>

                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>指数 / 持仓价</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                  {(b.market?.indices || []).map((ix, i) => (
                    <Chip key={i} size="small" label={`${ix.name} ${ix.px ?? '—'}${ix.chg != null ? ` (${ix.chg >= 0 ? '+' : ''}${ix.chg.toFixed(2)}%)` : ''}`} variant="outlined" />
                  ))}
                  {!b.market?.indices?.length && <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>无指数数据</Typography>}
                </Stack>

                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>触发条件命中（{(b.triggered || []).length}）</Typography>
                {(b.triggered || []).length === 0 ? (
                  <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>今日无触发命中。</Typography>
                ) : (
                  <Stack spacing={0.5}>
                    {(b.triggered || []).map((t, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, p: 0.75, borderRadius: tokens.radius.sm, bgcolor: tokens.warnSoft }}>
                        <StatusPill label={t.action} tone="warn" size="sm" />
                        <Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>{t.targetId} · {t.condition}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))
        )}

        <AssetTargetAdvice />
      </Box>
    </Box>
  )
}