import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import AutoGraph from '@mui/icons-material/AutoGraph'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import CircleFeedSection from '../components/CircleFeedSection'
import { CIRCLE } from '../lib/circleFeed'
import { useStore } from '../store/useStore'

/**
 * 月度操作思路（应用逻辑完善 §3.4 C4 + §3.3 C3）——
 * L4 草稿：有 L3 → 自动派生草稿；无 L3 → 进入待定态，仅输出 L2 月度快照 + 待办提示。
 * 观测点与触发条件反向喂给日度监控（§3.6 C6）。
 */
export default function MonthlyBrief() {
  const monthlyBriefs = useStore((s) => s.monthlyBriefs) || []
  const strategies = useStore((s) => s.strategies) || []
  const create = useStore((s) => s.create)
  const phase = useStore((s) => s.dashboard?.marketClock?.phase) || '—'

  const generate = () => {
    const month = new Date().toISOString().slice(0, 7)
    const l3 = strategies.find((s) => s.status !== '已失效') || strategies[0]
    let rec
    if (!l3) {
      // 无 L3 → 待定态：仅 L2 月度快照 + 待办提示
      rec = {
        month,
        observationPoints: [`L2 月度快照：当前周期阶段「${phase}」（待人工审定）`, 'L3 季度策略为空，后续填充后 L4 可自动派生'],
        triggers: [],
        plan: { assetClass: [], industry: [], targets: [], cadence: '待 L3 填充后派生', riskPlan: '' },
        status: '待审定',
        updatedAt: new Date().toISOString(),
      }
    } else {
      // 有 L3 → 派生草稿
      const aa = l3.assetAllocation || {}
      rec = {
        month,
        observationPoints: (l3.coreAssumptions || []).map((a) => `${a.text}（证伪即失效）`),
        triggers: (l3.industryFocus?.overweight || []).map((i) => ({ targetId: '', condition: `${i.name} 超配逻辑持续验证`, targetState: '趋势确认' })),
        plan: {
          assetClass: [
            `权益 ${aa.equityRange?.min ?? 0}~${aa.equityRange?.max ?? 0}%（${aa.equityTone || '中性'}）`,
            `债券 ${aa.bondRange?.min ?? 0}~${aa.bondRange?.max ?? 0}%`,
            `黄金 ${aa.goldRange?.min ?? 0}~${aa.goldRange?.max ?? 0}%`,
            `现金 ${aa.cashRange?.min ?? 0}~${aa.cashRange?.max ?? 0}%`,
          ],
          industry: (l3.industryFocus?.overweight || []).map((i) => `超配 ${i.name}`),
          targets: [],
          cadence: `风格侧重：${l3.styleBias || '均衡'}`,
          riskPlan: '回撤达15% → 权益降至≤60%；逻辑止损优先',
        },
        status: '待审定',
        updatedAt: new Date().toISOString(),
      }
    }
    create('monthlyBriefs', rec)
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台 / 日报周报月报"
        title="月度操作思路（L4 草稿）"
        subtitle="本月观测点 + 触发条件（反向喂日度监控） + 计划；有 L3 则自动派生，无 L3 则待定"
        actions={<Button variant="contained" startIcon={<AutoGraph />} onClick={generate} sx={{ bgcolor: tokens.primary }}>生成本月 L4 草稿</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: strategies.length ? tokens.aiSoft : tokens.warnSoft, border: `1px solid ${tokens.border}` }}>
          <Typography sx={{ fontSize: 12.5, color: tokens.ink700, lineHeight: 1.6 }}>
            {strategies.length
              ? '检测到 L3 季度策略，可基于其大类配置与行业主线自动派生本月 L4 草稿。'
              : '当前 L3 季度策略为空 → 进入待定态：仅输出 L2 月度快照与待办提示，不阻塞日/周节奏。'}
          </Typography>
        </Box>

        <CircleFeedSection
          title="市场分析直播（每月）"
          subtitle="张湧的小密圈 · 月度直播预告/主题/要点（本月自动过滤）"
          tagId={CIRCLE.tags.monthlyLive}
          rows={10}
          scope="month"
          emptyHint="本月暂无直播帖（通常月初发布预告）。"
        />

        {monthlyBriefs.length === 0 ? (
          <Card sx={{ p: 4, borderRadius: tokens.radius.md, border: `1px dashed ${tokens.border}` }}>
            <Typography sx={{ color: tokens.ink400, textAlign: 'center' }}>暂无月度操作思路。</Typography>
          </Card>
        ) : (
          [...monthlyBriefs].reverse().map((mb) => (
            <Card key={mb.id} sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md }}>
              <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <StatusPill label={`L4 · ${mb.month}`} tone="warn" />
                  <Chip size="small" label={mb.status} color="warning" variant="outlined" />
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>本月观测点（反向喂日度监控）</Typography>
                  <Stack spacing={0.4}>
                    {(mb.observationPoints || []).map((o, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', fontSize: 12.5, color: tokens.ink700 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: 1, bgcolor: tokens.primary }} /> {o}
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {(mb.triggers || []).length > 0 && (
                  <Box>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>本月触发条件</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      {(mb.triggers || []).map((t, i) => <Chip key={i} size="small" label={`${t.condition} → ${t.targetState}`} variant="outlined" />)}
                    </Stack>
                  </Box>
                )}

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>计划</Typography>
                  <Stack spacing={0.4}>
                    {(mb.plan?.assetClass || []).map((a, i) => <Typography key={i} sx={{ fontSize: 12.5, color: tokens.ink700 }}>· {a}</Typography>)}
                    {(mb.plan?.industry || []).map((a, i) => <Typography key={i} sx={{ fontSize: 12.5, color: tokens.primary }}>· {a}</Typography>)}
                    {mb.plan?.cadence ? <Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>· {mb.plan.cadence}</Typography> : null}
                    {mb.plan?.riskPlan ? <Typography sx={{ fontSize: 12.5, color: tokens.warn }}>· 风控：{mb.plan.riskPlan}</Typography> : null}
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