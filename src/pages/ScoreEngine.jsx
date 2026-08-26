import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import { useNavigate } from 'react-router-dom'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Error from '@mui/icons-material/Error'

import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import tokens from '../theme/tokens'
import useStore from '../store/useStore'

function SectionTitle({ children, desc, action, small }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: small ? 1 : 1.5, gap: 1 }}>
      <Box>
        <Typography sx={{ fontSize: small ? 13 : 15, fontWeight: 700, color: tokens.ink900 }}>{children}</Typography>
        {desc && <Typography sx={{ fontSize: 12, color: tokens.ink400, mt: 0.25 }}>{desc}</Typography>}
      </Box>
      {action}
    </Box>
  )
}

function Bar({ label, score, weight, agent, max = 100, accent }) {
  const w = Math.min(100, Math.max(0, (score / (weight * 100 / weight)) * 100))
  const actualPct = Math.min(100, (score / weight) * 100 * (weight / 100) * (100 / weight)) // 相对百分位
  const ratio = Math.min(100, (score / weight) * 100)
  return (
    <Box sx={{ mb: 1.2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.2 }}>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink700 }}>{label}</Typography>
        <Chip size="small" label={`权重 ${weight}`} variant="outlined" sx={{ fontSize: 10 }} />
        <Typography sx={{ ml: 'auto', fontSize: 12, fontWeight: 700, color: accent }}>{score} / {weight}</Typography>
        <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>（{agent}）</Typography>
      </Box>
      <Box sx={{ height: 8, width: '100%', borderRadius: 4, bgcolor: tokens.bgPage, overflow: 'hidden', border: `1px solid ${tokens.border}` }}>
        <Box sx={{ height: '100%', width: `${ratio}%`, bgcolor: accent, transition: 'width 0.3s' }} />
      </Box>
    </Box>
  )
}

const winLabels = {
  macroMatch: '宏观匹配度',
  industryProsperity: '行业景气度',
  fundamentalQuality: '基本面/经理质量',
  complianceRisk: '合规风控',
  sentimentAlignment: '情绪配合',
}
const oddLabels = {
  valuationAttractiveness: '估值吸引力',
  upsidePotential: '上行空间',
  downsideProtection: '下行保护',
  strategyFit: '策略适配度',
}

export default function ScoreEngine() {
  const navigate = useNavigate()
  const scoreCards = useStore((s) => s.scoreCards) || []
  const strategies = useStore((s) => s.strategies) || []
  const monthlyStrategies = useStore((s) => s.monthlyStrategies) || []

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台 / 七层决策漏斗"
        title="胜率赔率 · 仓位引擎 L5 / L6"
        subtitle="L5 胜率 5 维量化 + 赔率 4 维量化 → L6 仓位矩阵（胜率×赔率）+ 总纲第七章硬约束取较小值 + 行业集中度合并校验"
      />
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {scoreCards.length === 0 ? (
          <Card><CardContent><Typography color={tokens.ink400}>暂无评分卡。新增时可由协调 Agent 将 8 专家的结构化证据填充到各维度。</Typography></CardContent></Card>
        ) : (
          scoreCards.map((sc) => (
            <Card key={sc.id} sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <StatusPill label={`L5/L6 · ${sc.targetType}`} tone={sc.targetType === '基金' ? 'ai' : 'warn'} />
                  <Typography sx={{ fontSize: 17, fontWeight: 700, color: tokens.ink900 }}>{sc.targetCode} {sc.targetName}</Typography>
                  <Chip size="small" label={`优先级 ${sc.priorityTier}`} color={sc.priorityTier === 'S' ? 'error' : sc.priorityTier === 'A' ? 'warning' : sc.priorityTier === 'B' ? 'primary' : 'default'} />
                  <Chip size="small" label={`评估日 ${sc.evaluationDate || '—'}`} variant="outlined" />
                  <Typography sx={{ ml: 'auto', fontSize: 12, color: tokens.ink400 }}>
                    L3: {(strategies.find((x) => x.id === sc.strategyId) || {}).title || sc.strategyId || '未关联'}
                  </Typography>
                </Box>

                {/* L1 通过检查 */}
                <Box sx={{ p: 1.2, borderRadius: tokens.radius.sm, bgcolor: sc.l1Passed ? tokens.bgPage : '#fff3f3', border: `1px dashed ${tokens.border}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {sc.l1Passed ? <CheckCircle sx={{ fontSize: 14, color: tokens.success }} /> : <Error sx={{ fontSize: 14, color: tokens.warn }} />}
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: sc.l1Passed ? tokens.success : tokens.warn }}>
                      L1 原则检查：{sc.l1Passed ? '通过' : '未通过'}
                    </Typography>
                  </Box>
                  {sc.l1Violations?.length ? <Typography sx={{ fontSize: 12, color: tokens.warn, mt: 0.3 }}>违规：{sc.l1Violations.join('；')}</Typography> : null}
                </Box>

                <Grid container spacing={2}>
                  {/* 胜率 */}
                  <Grid item xs={12} md={6}>
                    <SectionTitle desc={`胜率总分 ${sc.winRate?.total || 0} / 100 · ${sc.winRate?.grade || '—'}`} small>胜率 5 维（满分 100，≥70 高 / 50-69 中 / &lt;50 低）</SectionTitle>
                    {Object.entries(sc.winRate?.breakdown || {}).map(([k, v]) => (
                      <Bar key={k} label={winLabels[k] || k} score={v?.score || 0} weight={v?.weight || 15} agent={v?.agent || '—'} accent={tokens.primary} />
                    ))}
                    <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip size="small" color={sc.winRate?.vetoByCompliance ? 'error' : 'success'} label={`合规${sc.winRate?.vetoByCompliance ? '否决' : '通过'}`} icon={sc.winRate?.vetoByCompliance ? <Error sx={{ fontSize: 12 }} /> : <CheckCircle sx={{ fontSize: 12 }} />} />
                      <Chip size="small" color={sc.winRate?.vetoByIndustryDeclineHighBeta ? 'error' : 'success'} label={`行业下跌+高贝塔${sc.winRate?.vetoByIndustryDeclineHighBeta ? '否决' : '通过'}`} icon={sc.winRate?.vetoByIndustryDeclineHighBeta ? <Error sx={{ fontSize: 12 }} /> : <CheckCircle sx={{ fontSize: 12 }} />} />
                      <Chip size="small" label={`胜率等级：${sc.winRate?.grade || '—'}`} />
                    </Stack>
                  </Grid>

                  {/* 赔率 */}
                  <Grid item xs={12} md={6}>
                    <SectionTitle desc={`赔率总分 ${sc.oddRate?.total || 0} / 100 · 盈亏比 ${sc.oddRate?.rewardRiskRatio || '—'}`} small>赔率 4 维（估值 30 + 上行 30 + 下行 25 + 策略 15）</SectionTitle>
                    {Object.entries(sc.oddRate?.breakdown || {}).map(([k, v]) => (
                      <Bar key={k} label={oddLabels[k] || k} score={v?.score || 0} weight={v?.weight || 25} agent={v?.agent || '—'} accent={tokens.warn} />
                    ))}
                    <Chip size="small" label={`赔率等级：${sc.oddRate?.grade || '—'}`} />
                  </Grid>
                </Grid>

                <Divider />

                {/* 吸引力 + 仓位建议 */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SectionTitle desc="吸引力 = 胜率×0.6 + 赔率×0.4，人类可±10分" small>吸引力 & 最终定位</SectionTitle>
                    <Box sx={{ p: 1.5, borderRadius: tokens.radius.md, bgcolor: tokens.bgPage }}>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography sx={{ fontSize: 11, color: tokens.ink500 }}>胜率×0.6</Typography>
                          <Typography sx={{ fontSize: 18, fontWeight: 800, color: tokens.primary }}>{Math.round((sc.winRate?.total || 0) * 0.6)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography sx={{ fontSize: 11, color: tokens.ink500 }}>赔率×0.4</Typography>
                          <Typography sx={{ fontSize: 18, fontWeight: 800, color: tokens.warn }}>{Math.round((sc.oddRate?.total || 0) * 0.4)}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography sx={{ fontSize: 11, color: tokens.ink500 }}>最终吸引力</Typography>
                          <Typography sx={{ fontSize: 20, fontWeight: 900, color: tokens.ink900 }}>{sc.finalAttractiveness || sc.attractiveness || 0}</Typography>
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 1.2 }} />
                      <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>
                        原始吸引力 <b>{sc.attractiveness}</b> · 人类调整 <b style={{ color: sc.humanAdjustment > 0 ? tokens.success : sc.humanAdjustment < 0 ? tokens.warn : tokens.ink500 }}>{sc.humanAdjustment > 0 ? '+' : ''}{sc.humanAdjustment}</b>
                        {sc.humanAdjustmentReason ? `（${sc.humanAdjustmentReason}）` : null}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <SectionTitle desc="L6 仓位建议：矩阵区间 vs 总纲第七章硬约束 取较小值" small>仓位建议 & 再平衡触发</SectionTitle>
                    <Box sx={{ p: 1.5, borderRadius: tokens.radius.md, bgcolor: tokens.bgPage }}>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        <Chip size="small" label={`矩阵建议 ${sc.positionAdvice?.matrixRange?.min}~${sc.positionAdvice?.matrixRange?.max}%`} color="primary" variant="outlined" />
                        <Chip size="small" label={`硬约束上限 ${sc.positionAdvice?.ruleCap}%`} color="warning" variant="outlined" />
                        <Chip size="small" label={`最终区间 ${sc.positionAdvice?.finalRange?.min}~${sc.positionAdvice?.finalRange?.max}%`} color="success" />
                        <Chip size="small" label={`类型：${sc.positionAdvice?.strategyType || '—'}`} variant="outlined" />
                        <Chip size="small" label={`仓内排名 #${sc.positionAdvice?.priorityRank || '—'}`} />
                      </Stack>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink500, mt: 0.5 }}>再平衡触发：</Typography>
                      <Stack spacing={0.2}>
                        <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>· 加仓：{sc.positionAdvice?.rebalanceTriggers?.addPosition || '—'}</Typography>
                        <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>· 减仓：{sc.positionAdvice?.rebalanceTriggers?.trimPosition || '—'}</Typography>
                        <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>· 止盈：{sc.positionAdvice?.rebalanceTriggers?.takeProfit || '—'}</Typography>
                        <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>· 止损：{sc.positionAdvice?.rebalanceTriggers?.stopLoss || '—'}</Typography>
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>

                <Divider />

                {/* 行业集中度合并 & L7纪律 */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SectionTitle small>行业敞口（基金穿透后与个股合并计算）</SectionTitle>
                    {(sc.positionAdvice?.industryExposures || []).length === 0 ? <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>无敞口数据</Typography> : (
                      <Stack spacing={0.3}>
                        {(sc.positionAdvice?.industryExposures || []).map((e, k) => (
                          <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: 12.5, color: tokens.ink700, flex: 1 }}>{e.industry}</Typography>
                            <Chip size="small" label={`${e.weightPct}%`} variant="outlined" />
                          </Box>
                        ))}
                      </Stack>
                    )}
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5, p: 1, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                      {sc.positionAdvice?.industryConcentrationOk ? <CheckCircle sx={{ fontSize: 14, color: tokens.success }} /> : <Error sx={{ fontSize: 14, color: tokens.warn }} />}
                      <Typography sx={{ fontSize: 12.5, color: sc.positionAdvice?.industryConcentrationOk ? tokens.ink700 : tokens.warn, fontWeight: 700 }}>
                        合计行业敞口：{sc.positionAdvice?.sameIndustryExposureTotal || 0}% · ≤30% {sc.positionAdvice?.industryConcentrationOk ? '合规' : '超限！必须降仓或分散'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <SectionTitle small>L7 投资纪律·一票否决（7 条红线）</SectionTitle>
                    <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip size="small" icon={sc.l7Checks?.hasMemo ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="有备忘录" color={sc.l7Checks?.hasMemo ? 'success' : 'error'} />
                      <Chip size="small" icon={sc.l7Checks?.withinTradingPlan ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="在交易计划内" color={sc.l7Checks?.withinTradingPlan ? 'success' : 'error'} />
                      <Chip size="small" icon={sc.l7Checks?.noIntradayDecision ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="非盘中决策" color={sc.l7Checks?.noIntradayDecision ? 'success' : 'error'} />
                      <Chip size="small" icon={sc.l7Checks?.stopLossDefined ? <CheckCircle sx={{ fontSize: 12 }} /> : <Error sx={{ fontSize: 12 }} />} label="止损明确" color={sc.l7Checks?.stopLossDefined ? 'success' : 'error'} />
                    </Stack>
                    <Box sx={{ mt: 1, p: 1, borderRadius: tokens.radius.sm, bgcolor: sc.l7Checks?.l7Passed ? tokens.bgPage : '#fff3f3', border: `1px dashed ${tokens.border}` }}>
                      {sc.l7Checks?.l7Passed ? (
                        <Typography sx={{ fontSize: 12.5, color: tokens.success, fontWeight: 700 }}>✅ L7 纪律全部通过，可进入执行。</Typography>
                      ) : (
                        <>
                          <Typography sx={{ fontSize: 12.5, color: tokens.warn, fontWeight: 700 }}>⚠️ L7 不通过，禁止执行。</Typography>
                          {(sc.l7Checks?.blockedReasons || []).map((r, k) => <Typography key={k} sx={{ fontSize: 12, color: tokens.warn }}>· {r}</Typography>)}
                        </>
                      )}
                    </Box>
                    {(sc.agentSources || []).length > 0 ? (
                      <Box sx={{ mt: 1 }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: tokens.ink500, mb: 0.3 }}>Agent 证据来源（本评分卡可信度溯源）：</Typography>
                        {(sc.agentSources || []).map((a, k) => (
                          <Typography key={k} sx={{ fontSize: 11, color: tokens.ink700 }}>· {a.agent}：{a.outputRef}（置信 {a.confidence}%）</Typography>
                        ))}
                      </Box>
                    ) : null}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  )
}
