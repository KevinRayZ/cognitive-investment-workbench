import React, { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Alert from '@mui/material/Alert'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Search from '@mui/icons-material/Search'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { useNavigate } from 'react-router-dom'

import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import tokens from '../theme/tokens'
import useStore from '../store/useStore'

const STEPS = ['步骤一：基金基础信息检索', '步骤二：持仓穿透（行业/风格/能力圈）', '步骤三：选基标准评分+一票否决', '步骤四：生成 L5 评分卡', '步骤五：行业集中度合并+最终决策']

const statusTone = { 成功: 'success', 待执行: 'neutral', 失败: 'warn' }

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

function StepBox({ idx, title, status, children, error }) {
  return (
    <Card sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, opacity: status === '待执行' ? 0.7 : 1 }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <StatusPill label={`Step${idx}`} tone={statusTone[status] || 'neutral'} />
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: tokens.ink900 }}>{title}</Typography>
          <Chip size="small" label={status} color={status === '成功' ? 'success' : status === '失败' ? 'error' : 'default'} variant={status === '待执行' ? 'outlined' : 'filled'} />
        </Box>
        {error ? <Alert severity="warning" sx={{ fontSize: 12 }}>{error}</Alert> : null}
        <Box>{children}</Box>
      </CardContent>
    </Card>
  )
}

export default function FundAnalyze() {
  const navigate = useNavigate()
  const jobs = useStore((s) => s.fundAnalysisJobs) || []
  const funds = useStore((s) => s.funds) || []
  const create = useStore((s) => s.create)

  const [input, setInput] = useState('')

  const submit = () => {
    const code = (input || '').trim()
    if (!code) return alert('请输入基金代码（6 位数字）。')
    create('fundAnalysisJobs', {
      code,
      submittedAt: new Date().toISOString().slice(0, 10),
      submittedBy: '手动',
      overallStatus: '进行中',
    })
    alert(`已提交基金代码 ${code}。请使用以下 MCP 能力获取真实数据并填充：\n\n• 东方财富妙想 MCP「综合诊基」：\n  提供 Step1 基础信息（经理/规模/净值/仓位）+ Step3 业绩/回撤/夏普/风格稳定性/能力圈。\n• 东方财富妙想「金融数据查询」（基金）：提供 Step2 最新持仓明细、行业分布。\n• 通达信 MCP / 腾讯自选股 MCP：补充 Step3 成分资金流与估值。\n\n获取后可直接打开本任务对应条目手动录入或由协调 Agent 自动回填。`)
    setInput('')
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台 / 基金"
        title="基金代码穿透分析（总纲 §15.9）"
        subtitle="输入基金代码 → 按总纲 §15.9 五步流程完成穿透：基础信息 → 持仓穿透 → 选基评分 → L5统一评分卡 → 行业集中度合并 + 最终决策。实际真实数据由东方财富妙想 MCP「综合诊基」「金融数据查询」自动提供。"
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 输入入口 */}
        <Card sx={{ border: `1px dashed ${tokens.primary}`, borderRadius: tokens.radius.md }}>
          <CardContent>
            <SectionTitle small>① 输入基金代码（6 位，如 005827 / 110022 / 161725）</SectionTitle>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="基金代码"
                placeholder="例如 005827"
                value={input}
                onChange={(e) => setInput(e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                InputProps={{ sx: { borderRadius: tokens.radius.sm } }}
                sx={{ flex: '1 1 200px', maxWidth: 420 }}
              />
              <Button variant="contained" startIcon={<Search />} onClick={submit} sx={{ bgcolor: tokens.primary, '&:hover': { bgcolor: tokens.primary } }}>
                发起穿透分析
              </Button>
              <Button variant="outlined" onClick={() => navigate('/funds')} endIcon={<ArrowForward />} sx={{ color: tokens.primary, borderColor: tokens.primary }}>
                回到基金池
              </Button>
            </Box>
            <Typography sx={{ mt: 1.5, fontSize: 12, color: tokens.ink500 }}>
              ⚠️ 当前前端展示为结构化容器与示例；真实数据可由「东方财富妙想 MCP 综合诊基 Skill」一键补齐：经理年限、基金规模、Top10 持仓、行业分布、近 3 年收益率、最大回撤、夏普比率、风格稳定性等，全部为 §15.9 对应字段。
            </Typography>
          </CardContent>
        </Card>

        {/* 任务列表 */}
        {jobs.length === 0 ? (
          <Card><CardContent><Typography color={tokens.ink400}>暂无基金穿透分析任务。输入代码并点击「发起穿透分析」新建。</Typography></CardContent></Card>
        ) : (
          jobs.map((job) => {
            const steps = [job.step1, job.step2, job.step3, job.step4, job.step5]
            const active = steps.findIndex((s) => s.status !== '成功')
            const statusMap = { 进行中: 'primary', 已准入: 'success', 已拒绝: 'error', 待人工复核: 'warning' }
            return (
              <Box key={job.id} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <StatusPill label={job.code} tone="ai" />
                  <Typography sx={{ fontSize: 16, fontWeight: 800, color: tokens.ink900 }}>
                    {job.step1?.fullName || '基础信息待检索'}
                  </Typography>
                  <Chip size="small" label={`发起：${job.submittedAt || '—'}`} variant="outlined" />
                  <Chip size="small" label={`来源：${job.submittedBy || '—'}`} variant="outlined" />
                  <Chip size="small" label={job.overallStatus || '进行中'} color={statusMap[job.overallStatus] || 'default'} sx={{ ml: 'auto' }} />
                </Box>

                {/* 进度条 */}
                <Card sx={{ p: 1.5, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md }}>
                  <Stepper activeStep={active >= 0 ? active : 5} alternativeLabel sx={{ '& .MuiStepLabel-label': { fontSize: 11, color: tokens.ink500 } }}>
                    {STEPS.map((label, i) => (
                      <Step key={label}>
                        <StepLabel optional={<Typography sx={{ fontSize: 10, color: tokens.ink400 }}>{steps[i]?.status}</Typography>}>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Card>

                {/* 五步详情 */}
                <StepBox idx={1} title={STEPS[0]} status={job.step1?.status} error={job.step1?.errorNote}>
                  {job.step1?.status === '待执行' ? null : (
                    <Grid container spacing={1.2}>
                      <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>类型</Typography><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{job.step1?.fundType || '—'}</Typography></Grid>
                      <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>公司</Typography><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{job.step1?.fundCompany || '—'}</Typography></Grid>
                      <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>基金经理/任职</Typography><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{job.step1?.manager || '—'} · {job.step1?.managerTenure} 年</Typography></Grid>
                      <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>成立日</Typography><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{job.step1?.inceptionDate || '—'}</Typography></Grid>
                      <Grid item xs={4}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>AUM（亿）</Typography><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{job.step1?.aum}</Typography></Grid>
                      <Grid item xs={4}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>最新净值</Typography><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{job.step1?.latestNav}</Typography></Grid>
                      <Grid item xs={4}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>权益仓位</Typography><Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>{job.step1?.equityRatio}%</Typography></Grid>
                    </Grid>
                  )}
                </StepBox>

                <StepBox idx={2} title={STEPS[1]} status={job.step2?.status}>
                  {job.step2?.status === '待执行' ? null : (
                    <>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12} md={6}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>Top 5 持仓</Typography>
                          {(job.step2?.topHoldings || []).map((h, k) => (
                            <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3, borderBottom: `1px dashed ${tokens.border}`, '&:last-child': { borderBottom: 0 } }}>
                              <Typography sx={{ fontSize: 12.5, color: tokens.ink900, flex: 1 }}>{k + 1}. {h.name}</Typography>
                              <Chip size="small" label={h.industry} variant="outlined" />
                              <Chip size="small" label={`${h.weight}%`} color="primary" />
                            </Box>
                          ))}
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>行业分布</Typography>
                          {(job.step2?.industryDistribution || []).map((i, k) => (
                            <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3, borderBottom: `1px dashed ${tokens.border}`, '&:last-child': { borderBottom: 0 } }}>
                              <Typography sx={{ fontSize: 12.5, color: tokens.ink900, flex: 1 }}>{i.industry}</Typography>
                              <Chip size="small" label={`${i.weight}%`} color="warning" />
                            </Box>
                          ))}
                        </Grid>
                      </Grid>
                      <Divider sx={{ my: 1.5 }} />
                      <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip size="small" label={`风格：${job.step2?.styleBox || '—'}`} />
                        <Chip size="small" label={`主投行业：${job.step2?.primaryIndustry || '—'}`} color="primary" variant="outlined" />
                        <Chip size="small" color={job.step2?.capabilityCircleMatch ? 'success' : 'warning'} label={`能力圈：${job.step2?.capabilityCircleMatch ? '命中' : '偏离'}`} />
                      </Stack>
                      {job.step2?.capabilityCircleGap ? <Typography sx={{ mt: 0.5, fontSize: 12, color: tokens.warn }}>偏离说明：{job.step2.capabilityCircleGap}</Typography> : null}
                    </>
                  )}
                </StepBox>

                <StepBox idx={3} title={STEPS[2]} status={job.step3?.status}>
                  {job.step3?.status === '待执行' ? null : (
                    <>
                      <Grid container spacing={1.2} sx={{ mb: 1.2 }}>
                        <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>今年收益</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.ytdReturn}%</Typography></Grid>
                        <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>近 1 年</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.oneYearReturn}%</Typography></Grid>
                        <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>近 3 年年化</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.threeYearAnnualReturn}%</Typography></Grid>
                        <Grid item xs={6} md={3}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>综合分</Typography><Typography sx={{ fontSize: 16, fontWeight: 900, color: tokens.primary }}>{job.step3?.finalFundScore}</Typography></Grid>
                        <Grid item xs={4}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>最大回撤</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.maxDrawdown}%</Typography></Grid>
                        <Grid item xs={4}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>夏普比率</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.sharpeRatio}</Typography></Grid>
                        <Grid item xs={4}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>波动率</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.volatility}%</Typography></Grid>
                        <Grid item xs={6}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>跟踪误差</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.trackingError}</Typography></Grid>
                        <Grid item xs={6}><Typography sx={{ fontSize: 11, color: tokens.ink500 }}>信息比率</Typography><Typography sx={{ fontSize: 13, fontWeight: 800 }}>{job.step3?.informationRatio}</Typography></Grid>
                      </Grid>
                      <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        <Chip size="small" color={job.step3?.aumCheck ? 'success' : 'error'} label={`AUM 区间(20-500亿)：${job.step3?.aumCheck ? '通过' : '不通过'}`} />
                        <Chip size="small" color={job.step3?.managerStyleStable ? 'success' : 'warning'} label={`经理风格稳定：${job.step3?.managerStyleStable ? '是' : '否'}`} />
                        <Chip size="small" color={job.step3?.styleMatchCapability ? 'success' : 'warning'} label={`风格匹配能力圈：${job.step3?.styleMatchCapability ? '是' : '否'}`} />
                        <Chip size="small" color={job.step3?.companyComplianceClean ? 'success' : 'error'} label={`公司合规无处罚：${job.step3?.companyComplianceClean ? '是' : '否'}`} />
                        <Chip size="small" color={job.step3?.vetoPassed ? 'success' : 'error'} icon={job.step3?.vetoPassed ? <CheckCircle sx={{ fontSize: 12 }} /> : null} label={`§13.2 一票否决：${job.step3?.vetoPassed ? '通过' : '不通过'}`} />
                      </Stack>
                      {(job.step3?.vetoHits || []).length > 0 ? (
                        <Box sx={{ mt: 1, p: 1, bgcolor: '#fff8f1', borderRadius: tokens.radius.sm, border: `1px dashed ${tokens.warn}` }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.warn, mb: 0.3 }}>⚠️ 否决命中项（即使最终通过也要明确标注）：</Typography>
                          {(job.step3.vetoHits || []).map((v, k) => <Typography key={k} sx={{ fontSize: 12, color: tokens.warn }}>· {v}</Typography>)}
                        </Box>
                      ) : null}
                    </>
                  )}
                </StepBox>

                <StepBox idx={4} title={STEPS[3]} status={job.step4?.status}>
                  {job.step4?.status === '待执行' ? (
                    <Typography sx={{ fontSize: 12.5, color: tokens.ink500 }}>{job.step4?.note || '等待 Step3 完成后，将 Step3 量化结果注入行业景气/基本面/合规维度，生成统一评分卡。'}</Typography>
                  ) : (
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label={`评分卡 ID: ${job.step4?.scoreCardId}`} color="primary" variant="outlined" />
                      <Button size="small" variant="text" onClick={() => navigate('/score-engine')}>跳转到评分卡查看 →</Button>
                    </Stack>
                  )}
                </StepBox>

                <StepBox idx={5} title={STEPS[4]} status={job.step5?.status}>
                  {job.step5?.status === '待执行' ? null : (
                    <>
                      <Stack direction="row" spacing={0.7} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        <Chip size="small" color={job.step5?.industryExposureCheck ? 'success' : 'warning'} label={`行业集中度≤30%：${job.step5?.industryExposureCheck ? '通过' : '不通过 ⚠️ 超限'}`} />
                        <Chip size="small" color={job.step5?.totalEquityCheck ? 'success' : 'warning'} label={`权益总仓位≤策略上限：${job.step5?.totalEquityCheck ? '通过' : '不通过'}`} />
                        <Chip size="small" color={job.step5?.finalDecision === '准入' ? 'success' : job.step5?.finalDecision === '已淘汰' ? 'error' : 'warning'} label={`最终裁决：${job.step5?.finalDecision}`} />
                      </Stack>
                      {job.step5?.decisionNote ? (
                        <Alert severity={job.step5?.industryExposureCheck === false ? 'warning' : 'info'} sx={{ fontSize: 12 }}>
                          {job.step5.decisionNote}
                        </Alert>
                      ) : null}
                    </>
                  )}
                </StepBox>
              </Box>
            )
          })
        )}

        {/* MCP能力提示 */}
        <Card sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, bgcolor: tokens.bgPage }}>
          <CardContent>
            <SectionTitle small>📡 MCP 实际数据能力支撑清单（已验证）</SectionTitle>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.primary, mb: 0.5 }}>① 东方财富妙想 · 综合诊基</Typography>
                <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>Step1 + Step3 全覆盖：基金基础信息、近 Y/1Y/3Y 收益、最大回撤、夏普、波动率、经理能力评估、风格稳定性、能力圈匹配度、业绩归因。</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.primary, mb: 0.5 }}>② 东方财富妙想 · 金融数据查询（基金）</Typography>
                <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>Step2 持仓穿透：最新 Top10 持仓、行业分布、风格箱、基金经理任职详情、历史净值曲线。</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: tokens.primary, mb: 0.5 }}>③ 腾讯自选股 / 通达信 MCP</Typography>
                <Typography sx={{ fontSize: 12, color: tokens.ink700 }}>持仓对应成分股的实时行情、PE/PB 估值分位、板块资金流向、北向资金流向 → 用于 Step3 评分 + Step5 行业集中度合并计算。</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
