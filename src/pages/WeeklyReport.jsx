import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import AutoGraph from '@mui/icons-material/AutoGraph'
import CheckCircle from '@mui/icons-material/CheckCircleOutline'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import { useStore } from '../store/useStore'
import { deriveHoldings, checkHealth } from '../utils/dashboard'

/**
 * 周度投资分析（应用逻辑完善 §3.4 C4 后半）——
 * 行业趋势状态 + 持仓健康 + L7 纪律审计 + 待办事项。
 * 定时调度（P3）后置，当前提供「生成本周分析」占位入口。
 */
export default function WeeklyReport() {
  const weeklyReports = useStore((s) => s.weeklyReports) || []
  const create = useStore((s) => s.create)
  const targets = useStore((s) => s.targets) || []
  const trades = useStore((s) => s.trades) || []
  const industryWatches = useStore((s) => s.industryWatches) || []

  const generate = () => {
    const { holdings } = deriveHoldings(trades, targets, {})
    const health = checkHealth(holdings)
    const violations = health.issues.map((i) => i.text)
    const boundaryCount = trades.filter((t) => t.isOutOfBoundary).length
    const now = new Date()
    const day = now.getDay() // 0=周日
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((day + 6) % 7))
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
    const iso = (d) => d.toISOString().slice(0, 10)

    const rec = {
      weekStart: iso(weekStart),
      weekEnd: iso(weekEnd),
      industryTrends: industryWatches.map((iw) => ({ industry: iw.name, trendState: iw.trend?.current || '—', score: iw.trend?.score ?? 0, change: iw.prosperity?.change || '稳定' })),
      holdingHealth: holdings.map((h) => ({ targetId: h.targetId || h.code, health: h.isOutOfBoundary ? '边界外' : h.weight > 20 ? '超限' : '正常', alerts: health.issues.filter((i) => i.text.includes(h.name)).map((i) => i.text) })),
      l7Audit: { violations, riskLevel: boundaryCount ? '偏高' : '低' },
      actionItems: violations.length ? violations : ['本周无纪律违规，保持观察'],
      updatedAt: new Date().toISOString(),
    }
    create('weeklyReports', rec)
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台 / 日报周报月报"
        title="周度投资分析"
        subtitle="行业趋势状态更新 · 持仓健康 · L7 纪律审计 · 待人类处理事项"
        actions={<Button variant="contained" startIcon={<AutoGraph />} onClick={generate} sx={{ bgcolor: tokens.primary }}>生成本周分析（占位）</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {weeklyReports.length === 0 ? (
          <Card sx={{ p: 4, borderRadius: tokens.radius.md, border: `1px dashed ${tokens.border}` }}>
            <Typography sx={{ color: tokens.ink400, textAlign: 'center' }}>暂无周度分析。</Typography>
          </Card>
        ) : (
          [...weeklyReports].reverse().map((r) => (
            <Card key={r.id} sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md }}>
              <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <StatusPill label={`${r.weekStart} ~ ${r.weekEnd}`} tone="ai" />
                  <Chip size="small" label={`L7 风险：${r.l7Audit?.riskLevel || '低'}`} color={r.l7Audit?.riskLevel === '低' ? 'success' : 'warning'} variant="outlined" />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>行业趋势状态</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {(r.industryTrends || []).map((it, i) => (
                      <Chip key={i} size="small" label={`${it.industry} · ${it.trendState} (${it.score})`} variant="outlined" />
                    ))}
                    {!r.industryTrends?.length && <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>无行业观察数据</Typography>}
                  </Stack>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>L7 纪律审计（{(r.l7Audit?.violations || []).length} 条）</Typography>
                  {(r.l7Audit?.violations || []).length === 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', color: tokens.down, fontSize: 12.5 }}><CheckCircle sx={{ fontSize: 15 }} />无违规</Box>
                  ) : (
                    <Stack spacing={0.4}>
                      {(r.l7Audit?.violations || []).map((v, i) => <Typography key={i} sx={{ fontSize: 12.5, color: tokens.warn }}>· {v}</Typography>)}
                    </Stack>
                  )}
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>待人类处理</Typography>
                  <Stack spacing={0.4}>
                    {(r.actionItems || []).map((a, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', fontSize: 12.5, color: tokens.ink700 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: 1, bgcolor: tokens.warn }} /> {a}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  )
}