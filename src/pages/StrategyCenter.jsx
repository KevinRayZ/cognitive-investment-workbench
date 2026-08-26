import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Button from '@mui/material/Button'
import CheckCircle from '@mui/icons-material/CheckCircle'
import RadioButtonUnchecked from '@mui/icons-material/RadioButtonUnchecked'
import Error from '@mui/icons-material/Error'

import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import tokens from '../theme/tokens'
import useStore from '../store/useStore'

const toneMap = { 草稿: 'default', 已审定: 'info', 执行中: 'warning', 已失效: 'default' }

function SectionTitle({ children, desc, action, small }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: small ? 1 : 1.5, mt: small ? 0 : 0, gap: 1 }}>
      <Box>
        <Typography sx={{ fontSize: small ? 13 : 15, fontWeight: 700, color: tokens.ink900 }}>{children}</Typography>
        {desc && <Typography sx={{ fontSize: 12, color: tokens.ink400, mt: 0.25 }}>{desc}</Typography>}
      </Box>
      {action}
    </Box>
  )
}

export default function StrategyCenter() {
  const navigate = useNavigate()
  const strategies = useStore((s) => s.strategies) || []
  const monthlyStrategies = useStore((s) => s.monthlyStrategies) || []

  const map = useMemo(() => {
    const m = new Map()
    monthlyStrategies.forEach((ms) => {
      const list = m.get(ms.strategyId) || []
      list.push(ms)
      m.set(ms.strategyId, list)
    })
    return m
  }, [monthlyStrategies])

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台 / 七层决策漏斗"
        title="策略中心 L3 / L4"
        subtitle="L3 季度战略配置（大方向不可轻易调） + L4 月度战术执行（可落地、带交易计划、带风控脚本）"
        actions={<Button variant="outlined" sx={{ color: tokens.primary, borderColor: tokens.primary }} onClick={() => navigate('/industry-watch')}>查看行业观察 →</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* L3 策略 */}
        <Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            pb: 1,
            borderBottom: `2px solid ${tokens.primary}`,
          }}>
            <Box sx={{ width: 6, height: 24, bgcolor: tokens.primary, borderRadius: 2 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: tokens.ink900 }}>L3 · 中长期（季度）策略</Typography>
            <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>对应总纲第十五章 §15.4.1 季度策略 5 要素</Typography>
          </Box>
          {strategies.length === 0 ? (
            <Card sx={{ p: 3, borderRadius: tokens.radius.md, border: `1px solid ${tokens.border}` }}><Typography sx={{ color: tokens.ink400, textAlign: 'center', py: 3 }}>暂无季度策略</Typography></Card>
          ) : (
            strategies.map((st) => (
              <Card key={st.id} sx={{
                border: `1px solid ${tokens.border}`,
                borderRadius: tokens.radius.md,
                overflow: 'hidden',
                transition: 'box-shadow 0.25s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(15,23,41,0.06)' },
              }}>
                <Box sx={{ height: 3, bgcolor: st.status === '执行中' ? tokens.warn : st.status === '已审定' ? tokens.ai : tokens.ink400 }} />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <StatusPill label={`L3 · ${st.ym}`} tone="ai" />
                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: tokens.ink900 }}>{st.title}</Typography>
                    <Chip size="small" label={st.status} color={toneMap[st.status]} variant="outlined" />
                    <Typography sx={{ ml: 'auto', fontSize: 12, color: tokens.ink400 }}>AI · 人类双审制 {st.version}</Typography>
                  </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>① 宏观判定</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip size="small" label={`${st.macroPhase} (置信 ${st.macroPhaseConfidence}%)`} />
                    </Stack>
                    <Typography sx={{ fontSize: 12.5, color: tokens.ink700, mt: 1 }}>{st.macroKeyRationale}</Typography>
                    {st.macroSignalConflicts ? (
                      <Box sx={{ mt: 1, p: 1, bgcolor: tokens.bgPage, borderRadius: tokens.radius.sm, border: `1px dashed ${tokens.border}` }}>
                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                          <Error sx={{ fontSize: 14, color: tokens.warn }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.warn }}>信号冲突</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.3 }}>{st.macroSignalConflicts}</Typography>
                      </Box>
                    ) : null}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>② 大类资产配置 ③ 风格偏向</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip size="small" label={`权益 ${st.assetAllocation?.equityRange?.min}~${st.assetAllocation?.equityRange?.max}% · ${st.assetAllocation?.equityTone}`} color="primary" variant="outlined" />
                      <Chip size="small" label={`债券 ${st.assetAllocation?.bondRange?.min}~${st.assetAllocation?.bondRange?.max}%`} variant="outlined" />
                      <Chip size="small" label={`黄金 ${st.assetAllocation?.goldRange?.min}~${st.assetAllocation?.goldRange?.max}%`} variant="outlined" />
                      <Chip size="small" label={`现金 ${st.assetAllocation?.cashRange?.min}~${st.assetAllocation?.cashRange?.max}%`} variant="outlined" />
                      <Chip size="small" label={`风格：${st.styleBias}`} color="warning" variant="outlined" />
                    </Stack>
                    <Box sx={{ mt: 1.5, p: 1.2, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink700, mb: 0.5 }}>AI · 证据链</Typography>
                      <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>宏观：{st.ais?.macroEvidence || '—'}</Typography>
                      <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.3 }}>行业：{st.ais?.industryEvidence || '—'}</Typography>
                      <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.3 }}>配置建议：{st.ais?.allocationSuggestion || '—'}</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>④ 行业偏向</Typography>
                    <Stack spacing={0.7}>
                      {(st.industryFocus?.overweight || []).map((i, k) => (
                        <Box key={k} sx={{ display: 'flex', gap: 1 }}><StatusPill label="超配" tone="success" /><Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>{i.name}（{i.code}）{i.reason ? `：${i.reason}` : ''}</Typography></Box>
                      ))}
                      {(st.industryFocus?.neutral || []).map((i, k) => (
                        <Box key={k} sx={{ display: 'flex', gap: 1 }}><StatusPill label="标配" tone="neutral" /><Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>{i.name}（{i.code}）</Typography></Box>
                      ))}
                      {(st.industryFocus?.underweight || []).map((i, k) => (
                        <Box key={k} sx={{ display: 'flex', gap: 1 }}><StatusPill label="低配" tone="warn" /><Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>{i.name}（{i.code}）：{i.reason}</Typography></Box>
                      ))}
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>⑤ 核心假设（需持续验证）</Typography>
                    <Stack spacing={0.6}>
                      {(st.coreAssumptions || []).map((a) => (
                        <Box key={a.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                          {a.verified ? <CheckCircle sx={{ fontSize: 14, color: tokens.success }} /> : <RadioButtonUnchecked sx={{ fontSize: 14, color: tokens.ink400 }} />}
                          <Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>{a.text}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink500, mb: 0.3 }}>人类裁决（必须）</Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip size="small" icon={st.humans?.phaseJudgement ? <CheckCircle sx={{ fontSize: 12 }} /> : <RadioButtonUnchecked sx={{ fontSize: 12 }} />} label={`阶段判断：${st.humans?.phaseJudgement ? '已确认' : '待确认'}`} variant="outlined" />
                      <Chip size="small" icon={st.humans?.industryPriority ? <CheckCircle sx={{ fontSize: 12 }} /> : <RadioButtonUnchecked sx={{ fontSize: 12 }} />} label={`行业优先级：${st.humans?.industryPriority ? '已确认' : '待确认'}`} variant="outlined" />
                      <Chip size="small" color={st.humans?.finalApproval ? 'success' : 'warning'} icon={st.humans?.finalApproval ? <CheckCircle sx={{ fontSize: 12 }} /> : <RadioButtonUnchecked sx={{ fontSize: 12 }} />} label={`最终审定：${st.humans?.finalApproval ? '通过' : '待审'}`} />
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))
        )}
        </Box>

        {/* L4 月度策略 */}
        <Box>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            mb: 2,
            pb: 1,
            borderBottom: `2px solid ${tokens.warn}`,
          }}>
            <Box sx={{ width: 6, height: 24, bgcolor: tokens.warn, borderRadius: 2 }} />
            <Typography sx={{ fontSize: 16, fontWeight: 800, color: tokens.ink900 }}>L4 · 月度战术策略</Typography>
            <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>对应总纲第十五章 §15.4.2 月度策略 6 要素</Typography>
          </Box>
          {monthlyStrategies.length === 0 ? (
            <Card sx={{ p: 3, borderRadius: tokens.radius.md, border: `1px solid ${tokens.border}` }}><Typography sx={{ color: tokens.ink400, textAlign: 'center', py: 3 }}>暂无月度策略</Typography></Card>
          ) : (
            monthlyStrategies.map((ms) => (
              <Card key={ms.id} sx={{
                border: `1px solid ${tokens.border}`,
                borderRadius: tokens.radius.md,
                overflow: 'hidden',
                transition: 'box-shadow 0.25s ease',
                '&:hover': { boxShadow: '0 4px 12px rgba(15,23,41,0.06)' },
              }}>
                <Box sx={{ height: 3, bgcolor: tokens.warn }} />
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <StatusPill label={`L4 · ${ms.ym}`} tone="warn" />
                    <Typography sx={{ fontSize: 17, fontWeight: 700, color: tokens.ink900 }}>{ms.title}</Typography>
                    <Chip size="small" label={`依赖L3: ${ms.strategyTitle || ms.strategyId}`} variant="outlined" />
                  </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>① 关键观察点（触发验证）</Typography>
                    <Stack spacing={0.5}>
                      {(ms.keyObservations || []).map((o, k) => (
                        <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.7, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                          {o.passed ? <CheckCircle sx={{ fontSize: 14, color: tokens.success }} /> : <RadioButtonUnchecked sx={{ fontSize: 14, color: tokens.warn }} />}
                          <Typography sx={{ fontSize: 12.5, flex: 1, color: tokens.ink700 }}>{o.text} · {o.metric} 目标 {o.target} · 实际 {o.actual || '待公布'}</Typography>
                        </Box>
                      ))}
                    </Stack>

                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mt: 2, mb: 0.5 }}>② 再平衡（大类）</Typography>
                    <Box sx={{ p: 1.2, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                      <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip size="small" label={`权益 ${ms.rebalancePlan?.equityChange || 0}pct`} />
                        <Chip size="small" label={`债券 ${ms.rebalancePlan?.bondChange || 0}pct`} />
                        <Chip size="small" label={`黄金 ${ms.rebalancePlan?.goldChange || 0}pct`} color="warning" />
                        <Chip size="small" label={`现金 ${ms.rebalancePlan?.cashChange || 0}pct`} />
                      </Stack>
                      <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.5 }}>{ms.rebalancePlan?.rationale}</Typography>
                    </Box>

                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mt: 2, mb: 0.5 }}>③ 行业调仓</Typography>
                    <Stack spacing={0.4}>
                      {(ms.industryRebalance || []).map((r, k) => (
                        <Box key={k} sx={{ display: 'flex', gap: 0.8 }}>
                          <StatusPill label={r.action} tone={r.action === '加仓' ? 'success' : r.action === '减仓' ? 'warn' : 'neutral'} />
                          <Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>{r.industryName} {r.changePct > 0 ? '+' : ''}{r.changePct}% — {r.reason}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>④ 标的行动计划（个股/基金通用）</Typography>
                    {(ms.targetActionPlan || []).length === 0 ? <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>无行动计划</Typography> : (
                      (ms.targetActionPlan || []).map((t, k) => (
                        <Box key={k} sx={{ p: 1, mb: 0.5, borderRadius: tokens.radius.sm, border: `1px solid ${tokens.border}` }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                            <StatusPill label={t.targetType} tone={t.targetType === '基金' ? 'ai' : 'neutral'} />
                            <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900 }}>{t.targetCode} {t.targetName}</Typography>
                            <Chip size="small" label={t.action} variant="outlined" sx={{ ml: 'auto' }} />
                          </Box>
                          <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.3 }}>目标仓位：{t.targetPositionRange?.min}~{t.targetPositionRange?.max}% · 触发：{(t.triggers || []).join(' / ')}</Typography>
                        </Box>
                      ))
                    )}

                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mt: 2, mb: 0.5 }}>⑤ 分批建仓脚本</Typography>
                    <Box sx={{ p: 1.2, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {(ms.tradeSchedule?.batches || []).map((b) => (
                          <Chip key={b.order} size="small" label={`第${b.order}批 ${(b.ratio * 100).toFixed(0)}% · ${b.timing}`} color={b.done ? 'success' : 'default'} variant={b.done ? 'filled' : 'outlined'} />
                        ))}
                        {ms.tradeSchedule?.addOnlyWhenProfitable ? <Chip size="small" label="盈利才加仓" /> : null}
                        {ms.tradeSchedule?.noAverageDown ? <Chip size="small" label="禁止摊平" color="warning" /> : null}
                      </Stack>
                    </Box>

                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mt: 2, mb: 0.5 }}>⑥ 风险脚本 + 纪律审计（L7）</Typography>
                    <Stack spacing={0.3}>
                      {(ms.riskScripts || []).map((r, k) => (
                        <Box key={k} sx={{ p: 0.7, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                          <Typography sx={{ fontSize: 12, color: tokens.warn }}>触发：{r.trigger}</Typography>
                          <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>脚本：{r.script}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    <Box sx={{ mt: 1, p: 1, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage, border: `1px dashed ${tokens.border}` }}>
                      <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip size="small" icon={ms.disciplineAudit?.allActionsHavePlan ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="所有动作有计划" color={ms.disciplineAudit?.allActionsHavePlan ? 'success' : 'error'} />
                        <Chip size="small" icon={ms.disciplineAudit?.noIntradayDecisions ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="无盘中决策" color={ms.disciplineAudit?.noIntradayDecisions ? 'success' : 'error'} />
                        <Chip size="small" icon={ms.disciplineAudit?.withinPositionLimits ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="仓位在限" color={ms.disciplineAudit?.withinPositionLimits ? 'success' : 'error'} />
                        <Chip size="small" icon={ms.disciplineAudit?.complianceChecksPassed ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="合规通过" color={ms.disciplineAudit?.complianceChecksPassed ? 'success' : 'error'} />
                      </Stack>
                      {ms.disciplineAudit?.notes ? <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.5 }}>备注：{ms.disciplineAudit.notes}</Typography> : null}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))
        )}
        </Box>
      </Box>
    </Box>
  )
}
