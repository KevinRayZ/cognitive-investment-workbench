import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/EditOutlined'
import Delete from '@mui/icons-material/DeleteOutline'
import ArrowBack from '@mui/icons-material/ArrowBack'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import Assessment from '@mui/icons-material/Assessment'
import PieChart from '@mui/icons-material/PieChart'
import ShowChart from '@mui/icons-material/ShowChart'
import Robot from '@mui/icons-material/SmartToyOutlined'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import KpiCard from '../components/KpiCard'
import { fmtPct } from '../utils/formatters'
import { createFund } from '../models/schemas'

const FUND_TYPE_COLORS = {
  主动股票型: 'primary',
  混合型: 'info',
  债券型: 'success',
  QDII: 'warning',
  行业主题: 'secondary',
}

const STATUS_COLORS = {
  观察中: 'default',
  已入选: 'primary',
  已持仓: 'success',
  已淘汰: 'warning',
}

function Section({ title, children, icon }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {icon}
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink900 }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  )
}

function MetricBox({ label, value, color, hint }) {
  return (
    <Box sx={{
      p: 1.5,
      borderRadius: tokens.radius.md,
      bgcolor: tokens.bgPage,
      textAlign: 'center',
      border: `1px solid ${tokens.border}`,
      transition: 'all 0.2s ease',
      '&:hover': {
        boxShadow: '0 2px 8px rgba(15,23,41,0.06)',
        transform: 'translateY(-1px)',
      },
    }}>
      <Typography sx={{ fontSize: 11, color: tokens.ink500, mb: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Typography>
      <Typography sx={{
        fontSize: 18,
        fontWeight: 700,
        color: color || tokens.ink900,
        fontFamily: '"Roboto Mono", monospace',
      }}>{value}</Typography>
      {hint && <Typography sx={{ fontSize: 10, color: tokens.ink400, mt: 0.3 }}>{hint}</Typography>}
    </Box>
  )
}

function ScoreBar({ score }) {
  const color = score >= 75 ? tokens.primary : score >= 60 ? tokens.ai : score >= 45 ? tokens.warn : tokens.ink400
  const gradient = score >= 75
    ? `linear-gradient(90deg, ${tokens.ai} 0%, ${tokens.primary} 100%)`
    : score >= 60
    ? `linear-gradient(90deg, ${tokens.warn} 0%, ${tokens.ai} 100%)`
    : `linear-gradient(90deg, ${tokens.ink400} 0%, ${tokens.warn} 100%)`
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        flex: 1,
        height: 8,
        borderRadius: 4,
        bgcolor: tokens.bgPage,
        overflow: 'hidden',
      }}>
        <Box sx={{
          width: `${score}%`,
          height: '100%',
          borderRadius: 4,
          background: gradient,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </Box>
      <Typography sx={{ fontSize: 12, fontWeight: 700, color: color, minWidth: 32, fontFamily: '"Roboto Mono", monospace' }}>{score}</Typography>
    </Box>
  )
}

export default function FundL3() {
  const funds = useStore((s) => s.funds || [])
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(createFund())
  const [detailFund, setDetailFund] = useState(null)
  const [filterType, setFilterType] = useState('all')

  const filteredFunds = filterType === 'all'
    ? funds
    : funds.filter((f) => f.fundType === filterType)

  const fundTypes = ['all', ...new Set(funds.map((f) => f.fundType))]

  const openNew = () => {
    setForm(createFund())
    setOpen(true)
  }

  const openDetail = (fund) => {
    setDetailFund(fund)
  }

  const openEdit = () => {
    setForm(detailFund)
    setOpen(true)
    setDetailFund(null)
  }

  const save = () => {
    if (form.id) update('funds', form.id, form)
    else create('funds', { ...form })
    setOpen(false)
  }

  const handleDelete = () => {
    if (detailFund && window.confirm(`确定删除基金 ${detailFund.name}？`)) {
      remove('funds', detailFund.id)
      setDetailFund(null)
    }
  }

  // 详情视图
  if (detailFund) {
    const f = detailFund
    const perf = f.performance || {}
    const risk = f.riskMetrics || {}
    const holdings = f.holdings || {}
    const val = f.valuation || {}

    return (
      <Box>
        <PageHeader
          breadcrumb="六层认知体系 / Layer ③ · 基金管理"
          title={`${f.name} · ${f.code}`}
          subtitle={`${f.fundType} | ${f.manager || '待补充'} | ${f.aum || 0}亿规模`}
          status={<StatusPill label={f.status} tone={STATUS_COLORS[f.status] || 'neutral'} />}
          actions={
            <>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setDetailFund(null)} sx={{ color: tokens.ink500, borderColor: tokens.border }}>返回</Button>
              <IconButton onClick={openEdit}><Edit sx={{ fontSize: 18, color: tokens.ink500 }} /></IconButton>
              <IconButton onClick={handleDelete}><Delete sx={{ fontSize: 18, color: tokens.up }} /></IconButton>
            </>
          }
        />

        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 综合评分 */}
          <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 12, color: tokens.ink500, mb: 1 }}>综合评分</Typography>
              <ScoreBar score={f.score} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={f.investmentStyle} size="small" color="primary" variant="outlined" />
              <Chip label={f.fundType} size="small" color={FUND_TYPE_COLORS[f.fundType] || 'default'} variant="outlined" />
            </Box>
          </Box>

          {/* 业绩指标 */}
          <Section title="业绩指标" icon={<ShowChart sx={{ fontSize: 18, color: tokens.primary }} />}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <MetricBox label="今年以来" value={perf.ytdReturn != null ? fmtPct(perf.ytdReturn) : '—'} color={perf.ytdReturn >= 0 ? tokens.up : tokens.down} />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricBox label="近1年" value={perf.oneYearReturn != null ? fmtPct(perf.oneYearReturn) : '—'} color={perf.oneYearReturn >= 0 ? tokens.up : tokens.down} />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricBox label="近3年年化" value={perf.threeYearReturn != null ? fmtPct(perf.threeYearReturn) : '—'} color={perf.threeYearReturn >= 0 ? tokens.up : tokens.down} />
              </Grid>
              <Grid item xs={6} md={3}>
                <MetricBox label="最大回撤" value={perf.maxDrawdown != null ? fmtPct(perf.maxDrawdown) : '—'} color={tokens.down} />
              </Grid>
            </Grid>
          </Section>

          {/* 风险指标 */}
          <Section title="风险指标" icon={<Assessment sx={{ fontSize: 18, color: tokens.warn }} />}>
            <Grid container spacing={2}>
              <Grid item xs={4} md={3}>
                <MetricBox label="夏普比率" value={perf.sharpeRatio != null ? perf.sharpeRatio.toFixed(2) : '—'} color={perf.sharpeRatio >= 1 ? tokens.primary : tokens.warn} />
              </Grid>
              <Grid item xs={4} md={3}>
                <MetricBox label="波动率" value={perf.volatility != null ? fmtPct(perf.volatility) : '—'} />
              </Grid>
              <Grid item xs={4} md={3}>
                <MetricBox label="跟踪误差" value={risk.trackingError != null ? fmtPct(risk.trackingError) : '—'} />
              </Grid>
              <Grid item xs={4} md={3}>
                <MetricBox label="信息比率" value={risk.informationRatio != null ? risk.informationRatio.toFixed(2) : '—'} color={risk.informationRatio >= 0.5 ? tokens.primary : tokens.warn} />
              </Grid>
            </Grid>
          </Section>

          {/* 持仓分析 */}
          <Section title="持仓分析" icon={<PieChart sx={{ fontSize: 18, color: tokens.ai }} />}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
              {/* 前十大重仓股 */}
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>重仓股</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>权重</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(holdings.topHoldings || []).map((h, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: 13 }}>{h.name}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 13 }}>{h.weight}%</TableCell>
                      </TableRow>
                    ))}
                    {(!holdings.topHoldings || holdings.topHoldings.length === 0) && (
                      <TableRow><TableCell colSpan={2} sx={{ textAlign: 'center', color: tokens.ink400 }}>暂无数据</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* 行业分布 */}
              <Box>
                <Typography sx={{ fontSize: 12, color: tokens.ink500, mb: 1 }}>行业分布</Typography>
                {(holdings.industryDistribution || []).map((ind, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                    <Typography sx={{ fontSize: 12, minWidth: 80 }}>{ind.industry}</Typography>
                    <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: tokens.bgPage }}>
                      <Box sx={{ width: `${ind.weight}%`, height: '100%', borderRadius: 3, bgcolor: tokens.ai }} />
                    </Box>
                    <Typography sx={{ fontSize: 12, fontFamily: '"Roboto Mono", monospace', minWidth: 36, textAlign: 'right' }}>{ind.weight}%</Typography>
                  </Box>
                ))}
                {(!holdings.industryDistribution || holdings.industryDistribution.length === 0) && (
                  <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>暂无数据</Typography>
                )}
              </Box>
            </Box>
          </Section>

          {/* 基金经理与估值 */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Section title="基金经理" icon={<Assessment sx={{ fontSize: 18, color: tokens.primary }} />}>
                <Box sx={{ p: 2, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, mb: 1 }}>{f.manager || '—'}</Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>任职年限：{f.managerTenure || 0} 年</Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>成立日期：{f.inceptionDate || '—'}</Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>规模：{f.aum || 0} 亿</Typography>
                </Box>
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section title="估值定位" icon={<TrendingUp sx={{ fontSize: 18, color: tokens.warn }} />}>
                <Box sx={{ p: 2, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                  <Typography sx={{ fontSize: 12, color: tokens.ink500, mb: 1 }}>PE分位：{val.pePercentile != null ? fmtPct(val.pePercentile) : '—'}</Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>同类排名：{val.categoryRank || '—'}</Typography>
                  <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>换手率：{holdings.turnoverRate != null ? `${holdings.turnoverRate}%` : '—'}</Typography>
                </Box>
              </Section>
            </Grid>
          </Grid>

          {/* AI分析建议 */}
          <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.aiSoft, border: `1px solid ${tokens.ai}`, display: 'flex', gap: 1.5 }}>
            <Robot sx={{ fontSize: 20, color: tokens.ai }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.ai, mb: 0.5 }}>AI分析建议</Typography>
              <Typography sx={{ fontSize: 13, color: tokens.ink700 }}>
                {f.analysisNotes || '暂无分析备注。建议定期复核基金业绩、基金经理变更、持仓变化等核心指标，确保基金持续符合投资体系要求。'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>编辑基金 · {form.name || form.code}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="基金名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ flex: 1 }} />
                <TextField label="基金代码" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={{ width: 140 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="基金类型" value={form.fundType} onChange={(e) => setForm({ ...form, fundType: e.target.value })} sx={{ flex: 1 }}>
                  {['主动股票型', '混合型', '债券型', 'QDII', '行业主题'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField select label="投资风格" value={form.investmentStyle} onChange={(e) => setForm({ ...form, investmentStyle: e.target.value })} sx={{ flex: 1 }}>
                  {['成长', '价值', '均衡', '红利', '逆向', '消费', '科技', '医药'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="基金经理" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} sx={{ flex: 1 }} />
                <TextField label="任职年限(年)" type="number" value={form.managerTenure} onChange={(e) => setForm({ ...form, managerTenure: Number(e.target.value) })} sx={{ width: 140 }} />
                <TextField label="规模(亿)" type="number" value={form.aum} onChange={(e) => setForm({ ...form, aum: Number(e.target.value) })} sx={{ width: 140 }} />
              </Box>
              <Divider />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>业绩指标</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="今年以来%" type="number" value={form.performance?.ytdReturn ?? ''} onChange={(e) => setForm({ ...form, performance: { ...form.performance, ytdReturn: Number(e.target.value) } })} sx={{ width: 120 }} />
                <TextField label="近1年%" type="number" value={form.performance?.oneYearReturn ?? ''} onChange={(e) => setForm({ ...form, performance: { ...form.performance, oneYearReturn: Number(e.target.value) } })} sx={{ width: 120 }} />
                <TextField label="近3年%" type="number" value={form.performance?.threeYearReturn ?? ''} onChange={(e) => setForm({ ...form, performance: { ...form.performance, threeYearReturn: Number(e.target.value) } })} sx={{ width: 120 }} />
                <TextField label="最大回撤%" type="number" value={form.performance?.maxDrawdown ?? ''} onChange={(e) => setForm({ ...form, performance: { ...form.performance, maxDrawdown: Number(e.target.value) } })} sx={{ width: 120 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="夏普比率" type="number" value={form.performance?.sharpeRatio ?? ''} onChange={(e) => setForm({ ...form, performance: { ...form.performance, sharpeRatio: Number(e.target.value) } })} sx={{ width: 120 }} />
                <TextField label="波动率%" type="number" value={form.performance?.volatility ?? ''} onChange={(e) => setForm({ ...form, performance: { ...form.performance, volatility: Number(e.target.value) } })} sx={{ width: 120 }} />
              </Box>
              <Divider />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>风险指标</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="跟踪误差%" type="number" value={form.riskMetrics?.trackingError ?? ''} onChange={(e) => setForm({ ...form, riskMetrics: { ...form.riskMetrics, trackingError: Number(e.target.value) } })} sx={{ width: 120 }} />
                <TextField label="信息比率" type="number" value={form.riskMetrics?.informationRatio ?? ''} onChange={(e) => setForm({ ...form, riskMetrics: { ...form.riskMetrics, informationRatio: Number(e.target.value) } })} sx={{ width: 120 }} />
                <TextField label="下行风险%" type="number" value={form.riskMetrics?.downsideRisk ?? ''} onChange={(e) => setForm({ ...form, riskMetrics: { ...form.riskMetrics, downsideRisk: Number(e.target.value) } })} sx={{ width: 120 }} />
              </Box>
              <TextField label="分析备注" value={form.analysisNotes} onChange={(e) => setForm({ ...form, analysisNotes: e.target.value })} multiline minRows={3} fullWidth />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ width: 140 }}>
                  {['观察中', '已入选', '已持仓', '已淘汰'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                <TextField label="综合评分" type="number" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} sx={{ width: 140 }} />
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button variant="contained" onClick={save} sx={{ bgcolor: tokens.primary }}>保存</Button>
          </DialogActions>
        </Dialog>
      </Box>
    )
  }

  // 列表视图
  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ③ · 基金管理"
        title="主动型基金管理"
        subtitle="基金池管理 · 业绩跟踪 · 风险监控"
      />

      <Box sx={{ p: 3 }}>
        {/* 筛选器 */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 13, color: tokens.ink500, mr: 1 }}>筛选：</Typography>
          {fundTypes.map((type) => (
            <Chip
              key={type}
              label={type === 'all' ? '全部' : type}
              size="small"
              color={filterType === type ? 'primary' : 'default'}
              variant={filterType === type ? 'filled' : 'outlined'}
              onClick={() => setFilterType(type)}
            />
          ))}
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.primary }}>
            新增基金
          </Button>
        </Box>

        {/* 基金列表 */}
        <Grid container spacing={2}>
          {filteredFunds.map((fund) => (
            <Grid item xs={12} md={6} lg={4} key={fund.id}>
              <Paper
                elevation={0}
                onClick={() => openDetail(fund)}
                sx={{
                  p: 2,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.border}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: tokens.primary,
                    boxShadow: '0 4px 12px rgba(47, 84, 235, 0.08)',
                    transform: 'translateY(-2px)',
                  },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    bgcolor: fund.status === '已持仓' ? tokens.down
                      : fund.status === '已入选' ? tokens.primary
                      : fund.status === '已淘汰' ? tokens.warn
                      : tokens.ink400,
                  },
                }}
              >
                {/* 标题行 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 15 }}>{fund.name}</Typography>
                    <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 12, color: tokens.ink500 }}>{fund.code}</Typography>
                  </Box>
                  <StatusPill label={fund.status} tone={STATUS_COLORS[fund.status] || 'neutral'} size="sm" />
                </Box>

                {/* 基金类型标签 */}
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  <Chip label={fund.fundType} size="small" color={FUND_TYPE_COLORS[fund.fundType] || 'default'} variant="outlined" />
                  <Chip label={fund.investmentStyle} size="small" variant="outlined" />
                </Stack>

                {/* 业绩概览 */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.75, p: 1, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 10, color: tokens.ink400, textTransform: 'uppercase', letterSpacing: '0.5px' }}>今年</Typography>
                    <Typography sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: fund.performance?.ytdReturn >= 0 ? tokens.up : tokens.down,
                      fontFamily: '"Roboto Mono", monospace',
                      mt: 0.3,
                    }}>
                      {fund.performance?.ytdReturn != null ? fmtPct(fund.performance.ytdReturn) : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', borderLeft: `1px solid ${tokens.border}`, borderRight: `1px solid ${tokens.border}` }}>
                    <Typography sx={{ fontSize: 10, color: tokens.ink400, textTransform: 'uppercase', letterSpacing: '0.5px' }}>3年</Typography>
                    <Typography sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: fund.performance?.threeYearReturn >= 0 ? tokens.up : tokens.down,
                      fontFamily: '"Roboto Mono", monospace',
                      mt: 0.3,
                    }}>
                      {fund.performance?.threeYearReturn != null ? fmtPct(fund.performance.threeYearReturn) : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 10, color: tokens.ink400, textTransform: 'uppercase', letterSpacing: '0.5px' }}>回撤</Typography>
                    <Typography sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: tokens.down,
                      fontFamily: '"Roboto Mono", monospace',
                      mt: 0.3,
                    }}>
                      {fund.performance?.maxDrawdown != null ? fmtPct(fund.performance.maxDrawdown) : '—'}
                    </Typography>
                  </Box>
                </Box>

                {/* 评分条 */}
                <Box>
                  <Typography sx={{ fontSize: 11, color: tokens.ink400, mb: 0.5 }}>综合评分</Typography>
                  <ScoreBar score={fund.score} />
                </Box>

                {/* 基金经理 */}
                <Box sx={{ mt: 'auto' }}>
                  <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>
                    {fund.manager} · {fund.aum}亿 · 任职{fund.managerTenure}年
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {filteredFunds.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, color: tokens.ink400 }}>
            <Typography sx={{ fontSize: 14 }}>暂无基金，点击「新增基金」开始建立基金池</Typography>
          </Box>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新增基金</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="基金名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="基金代码" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={{ width: 140 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="基金类型" value={form.fundType} onChange={(e) => setForm({ ...form, fundType: e.target.value })} sx={{ flex: 1 }}>
                {['主动股票型', '混合型', '债券型', 'QDII', '行业主题'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField select label="投资风格" value={form.investmentStyle} onChange={(e) => setForm({ ...form, investmentStyle: e.target.value })} sx={{ flex: 1 }}>
                {['成长', '价值', '均衡', '红利', '逆向', '消费', '科技', '医药'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="基金经理" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="任职年限(年)" type="number" value={form.managerTenure} onChange={(e) => setForm({ ...form, managerTenure: Number(e.target.value) })} sx={{ width: 140 }} />
              <TextField label="规模(亿)" type="number" value={form.aum} onChange={(e) => setForm({ ...form, aum: Number(e.target.value) })} sx={{ width: 140 }} />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: tokens.primary }}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
