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
import Grid from '@mui/material/Grid'
import Divider from '@mui/material/Divider'
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/EditOutlined'
import Delete from '@mui/icons-material/DeleteOutline'
import ArrowBack from '@mui/icons-material/ArrowBack'
import TrendingUp from '@mui/icons-material/TrendingUp'
import TrendingDown from '@mui/icons-material/TrendingDown'
import ShowChart from '@mui/icons-material/ShowChart'
import Assessment from '@mui/icons-material/Assessment'
import Target from '@mui/icons-material/CenterFocusWeak'
import Flag from '@mui/icons-material/Flag'
import PieChart from '@mui/icons-material/PieChart'
import Robot from '@mui/icons-material/SmartToyOutlined'
import CheckCircle from '@mui/icons-material/CheckCircle'
import Cancel from '@mui/icons-material/Cancel'
import Pending from '@mui/icons-material/Pending'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import KpiCard from '../components/KpiCard'
import { fmtPct } from '../utils/formatters'
import { createIndustryWatch } from '../models/schemas'

const TREND_COLORS = {
  上升趋势: { color: tokens.up, bg: '#FEECEC' },
  下降趋势: { color: tokens.down, bg: '#E8F5E9' },
  平稳震荡: { color: tokens.ink500, bg: '#F5F5F5' },
  拐点待确认: { color: '#F59E0B', bg: '#FFFBEB' },
}

const STATUS_COLORS = {
  待观察: 'default',
  趋势确认: 'primary',
  择时入场: 'info',
  已入场: 'success',
  已放弃: 'warning',
}

const CATEGORY_COLORS = {
  一级核心: 'primary',
  二级重点: 'info',
  三级机会: 'default',
}

function TrendIndicator({ trend }) {
  const config = TREND_COLORS[trend] || TREND_COLORS['拐点待确认']
  const Icon = trend === '上升趋势' ? TrendingUp : trend === '下降趋势' ? TrendingDown : trend === '平稳震荡' ? ShowChart : Pending
  return (
    <Box sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      px: 1,
      py: 0.3,
      borderRadius: 1,
      bgcolor: config.bg,
      color: config.color,
    }}>
      <Icon sx={{ fontSize: 14 }} />
      <Typography sx={{ fontSize: 11, fontWeight: 600 }}>{trend}</Typography>
    </Box>
  )
}

function IndicatorCheck({ label, value, trend }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {value ? (
        <CheckCircle sx={{ fontSize: 14, color: tokens.down }} />
      ) : (
        <Cancel sx={{ fontSize: 14, color: tokens.ink400 }} />
      )}
      <Typography sx={{ fontSize: 12, color: value ? tokens.down : tokens.ink500 }}>{label}</Typography>
    </Box>
  )
}

function ScoreBar({ score, color }) {
  const finalColor = color || (score >= 75 ? tokens.up : score >= 60 ? tokens.primary : score >= 45 ? tokens.warn : tokens.ink400)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{
        width: `${score}%`,
        height: 6,
        borderRadius: 3,
        bgcolor: finalColor,
      }} />
      <Typography sx={{ fontSize: 11, fontWeight: 600, color: finalColor }}>{score}</Typography>
    </Box>
  )
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

export default function IndustryWatch() {
  const industryWatches = useStore((s) => s.industryWatches || [])
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(createIndustryWatch())
  const [detailItem, setDetailItem] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const filteredItems = industryWatches.filter((item) => {
    const matchStatus = filterStatus === 'all' || item.status === filterStatus
    const matchCategory = filterCategory === 'all' || item.category === filterCategory
    return matchStatus && matchCategory
  })

  const statuses = ['all', '待观察', '趋势确认', '择时入场', '已入场', '已放弃']
  const categories = ['all', '一级核心', '二级重点', '三级机会']

  const openNew = () => {
    setForm(createIndustryWatch())
    setOpen(true)
  }

  const openDetail = (item) => {
    setDetailItem(item)
  }

  const openEdit = () => {
    setForm(detailItem)
    setOpen(true)
    setDetailItem(null)
  }

  const save = () => {
    if (form.id) update('industryWatches', form.id, form)
    else create('industryWatches', { ...form })
    setOpen(false)
  }

  const handleDelete = () => {
    if (detailItem && window.confirm(`确定删除「${detailItem.name}」行业观察？`)) {
      remove('industryWatches', detailItem.id)
      setDetailItem(null)
    }
  }

  // 详情视图
  if (detailItem) {
    const item = detailItem
    const prosperity = item.prosperity || {}
    const valuation = item.valuation || {}
    const capitalFlow = item.capitalFlow || {}
    const policy = item.policy || {}
    const indicators = item.indicators || {}

    return (
      <Box>
        <PageHeader
          breadcrumb="六层认知体系 / Layer ③ · 行业观察"
          title={`${item.name} · 行业趋势观察`}
          subtitle={`${item.category} | ${item.trend?.current} | 状态：${item.status}`}
          status={<StatusPill label={item.status} tone={STATUS_COLORS[item.status] || 'neutral'} />}
          actions={
            <>
              <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => setDetailItem(null)} sx={{ color: tokens.ink500, borderColor: tokens.border }}>返回</Button>
              <IconButton onClick={openEdit}><Edit sx={{ fontSize: 18, color: tokens.ink500 }} /></IconButton>
              <IconButton onClick={handleDelete}><Delete sx={{ fontSize: 18, color: tokens.up }} /></IconButton>
            </>
          }
        />

        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 趋势状态 */}
          <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <TrendIndicator trend={item.trend?.current} />
            <Box>
              <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>趋势评分</Typography>
              <ScoreBar score={item.trend?.score || 50} />
            </Box>
            <Chip label={`方向：${item.trend?.direction || '中性'}`} size="small" variant="outlined" />
            <Chip label={item.category} size="small" color={CATEGORY_COLORS[item.category] || 'default'} />
          </Box>

          {/* 核心指标验证 */}
          <Section title="趋势指标验证" icon={<Target sx={{ fontSize: 18, color: tokens.primary }} />}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <IndicatorCheck label="景气度向好" value={indicators.prosperityTrend} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <IndicatorCheck label="资金面向好" value={indicators.capitalFlowTrend} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <IndicatorCheck label="估值面向好" value={indicators.valuationTrend} />
                </Grid>
                <Grid item xs={6} md={3}>
                  <IndicatorCheck label="政策面向好" value={indicators.policyTrend} />
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>
                  趋势已确认（至少3个指标同向）：
                </Typography>
                <Chip
                  label={indicators.confirmed ? '已确认' : '未确认'}
                  size="small"
                  color={indicators.confirmed ? 'success' : 'default'}
                  variant={indicators.confirmed ? 'filled' : 'outlined'}
                />
              </Box>
            </Paper>
          </Section>

          {/* 景气度与资金面 */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Section title="景气度指标" icon={<ShowChart sx={{ fontSize: 18, color: tokens.ai }} />}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>景气度评分</Typography>
                    <Chip
                      label={`${prosperity.score || 3}/5`}
                      size="small"
                      color={prosperity.score >= 4 ? 'success' : prosperity.score <= 2 ? 'warning' : 'default'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>营收增速</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: (prosperity.revenueGrowth || 0) >= 0 ? tokens.up : tokens.down }}>
                      {prosperity.revenueGrowth != null ? fmtPct(prosperity.revenueGrowth) : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>利润增速</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: (prosperity.profitGrowth || 0) >= 0 ? tokens.up : tokens.down }}>
                      {prosperity.profitGrowth != null ? fmtPct(prosperity.profitGrowth) : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>产能利用率</Typography>
                    <Typography sx={{ fontSize: 13 }}>{prosperity.capacityUtilization != null ? fmtPct(prosperity.capacityUtilization) : '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>景气变化</Typography>
                    <Chip label={prosperity.change || '稳定'} size="small" />
                  </Box>
                </Paper>
              </Section>
            </Grid>

            <Grid item xs={12} md={6}>
              <Section title="资金流向" icon={<TrendingUp sx={{ fontSize: 18, color: tokens.primary }} />}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>主力资金</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: (capitalFlow.mainFlow || 0) >= 0 ? tokens.up : tokens.down }}>
                      {capitalFlow.mainFlow != null ? `${capitalFlow.mainFlow > 0 ? '+' : ''}${capitalFlow.mainFlow}亿` : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>北向资金</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: (capitalFlow.northFlow || 0) >= 0 ? tokens.up : tokens.down }}>
                      {capitalFlow.northFlow != null ? `${capitalFlow.northFlow > 0 ? '+' : ''}${capitalFlow.northFlow}亿` : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>ETF份额变化</Typography>
                    <Typography sx={{ fontSize: 13 }}>
                      {capitalFlow.etfShareChange != null ? `${capitalFlow.etfShareChange > 0 ? '+' : ''}${fmtPct(capitalFlow.etfShareChange)}` : '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500, mb: 0.5 }}>资金面趋势</Typography>
                    <Chip
                      label={capitalFlow.trend || '中性'}
                      size="small"
                      color={capitalFlow.trend === '流入' ? 'success' : capitalFlow.trend === '流出' ? 'warning' : 'default'}
                    />
                  </Box>
                </Paper>
              </Section>
            </Grid>
          </Grid>

          {/* 估值与政策 */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Section title="估值指标" icon={<Assessment sx={{ fontSize: 18, color: tokens.warn }} />}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>PE-TTM</Typography>
                    <Typography sx={{ fontSize: 13 }}>{valuation.pe != null ? valuation.pe : '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>PE分位</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{valuation.pePercentile != null ? fmtPct(valuation.pePercentile) : '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>PB</Typography>
                    <Typography sx={{ fontSize: 13 }}>{valuation.pb != null ? valuation.pb : '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>股息率</Typography>
                    <Typography sx={{ fontSize: 13 }}>{valuation.dividendYield != null ? fmtPct(valuation.dividendYield) : '—'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>合理估值区间</Typography>
                    <Typography sx={{ fontSize: 13 }}>{valuation.fairValue || '—'}</Typography>
                  </Box>
                </Paper>
              </Section>
            </Grid>

            <Grid item xs={12} md={6}>
              <Section title="政策导向" icon={<Flag sx={{ fontSize: 18, color: tokens.primary }} />}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: 12, color: tokens.ink500, mb: 0.5 }}>政策支持等级</Typography>
                    <Chip
                      label={policy.supportLevel || '中性'}
                      size="small"
                      color={policy.supportLevel === '强支持' ? 'success' : policy.supportLevel === '支持' ? 'primary' : policy.supportLevel === '限制' ? 'warning' : 'default'}
                    />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  {(policy.keyPolicies || []).map((p, i) => (
                    <Box key={i} sx={{ mb: 1 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{p.name}</Typography>
                      <Typography sx={{ fontSize: 11, color: tokens.ink500 }}>
                        {p.date} · 影响：{p.impact}
                      </Typography>
                    </Box>
                  ))}
                  {(!policy.keyPolicies || policy.keyPolicies.length === 0) && (
                    <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>暂无关键政策记录</Typography>
                  )}
                  {policy.notes && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>{policy.notes}</Typography>
                    </>
                  )}
                </Paper>
              </Section>
            </Grid>
          </Grid>

          {/* 触发条件与配置建议 */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Section title="交易触发条件" icon={<Target sx={{ fontSize: 18, color: tokens.ai }} />}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.down, mb: 0.5 }}>入场条件</Typography>
                    {(item.triggerConditions?.entry || []).map((cond, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: tokens.down }} />
                        <Typography sx={{ fontSize: 12 }}>{cond}</Typography>
                      </Box>
                    ))}
                    {(!item.triggerConditions?.entry || item.triggerConditions.entry.length === 0) && (
                      <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>暂无入场条件</Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.warn, mb: 0.5 }}>离场条件</Typography>
                    {(item.triggerConditions?.exit || []).map((cond, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: tokens.warn }} />
                        <Typography sx={{ fontSize: 12 }}>{cond}</Typography>
                      </Box>
                    ))}
                    {(!item.triggerConditions?.exit || item.triggerConditions.exit.length === 0) && (
                      <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>暂无离场条件</Typography>
                    )}
                  </Box>
                </Paper>
              </Section>
            </Grid>

            <Grid item xs={12} md={6}>
              <Section title="配置建议" icon={<PieChart sx={{ fontSize: 18, color: tokens.primary }} />}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Box textAlign="center">
                      <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>建议仓位</Typography>
                      <Typography sx={{ fontSize: 24, fontWeight: 700, color: tokens.primary, fontFamily: '"Roboto Mono", monospace' }}>
                        {item.allocationSuggestion?.position || 0}%
                      </Typography>
                    </Box>
                    <Box textAlign="center">
                      <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>操作建议</Typography>
                      <Chip
                        label={item.allocationSuggestion?.type || '观望'}
                        size="medium"
                        color={item.allocationSuggestion?.type === '加仓' ? 'success' : item.allocationSuggestion?.type === '减仓' ? 'warning' : 'default'}
                      />
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1.5 }} />
                  <Box textAlign="center">
                    <Typography sx={{ fontSize: 11, color: tokens.ink400, mb: 0.5 }}>择时建议</Typography>
                    <Chip
                      label={item.allocationSuggestion?.timing || '等待信号'}
                      size="small"
                      color={item.allocationSuggestion?.timing === '可建仓' ? 'success' : 'default'}
                    />
                  </Box>
                </Paper>
              </Section>
            </Grid>
          </Grid>

          {/* 关联标的 */}
          {item.relatedTargets && item.relatedTargets.length > 0 && (
            <Section title="关联标的" icon={<Target sx={{ fontSize: 18, color: tokens.ai }} />}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12 }}>标的名称</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 12 }}>建议权重</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {item.relatedTargets.map((t, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: 13 }}>{t.targetName}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 13 }}>{t.weight}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Section>
          )}

          {/* AI分析 */}
          <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.aiSoft, border: `1px solid ${tokens.ai}`, display: 'flex', gap: 1.5 }}>
            <Robot sx={{ fontSize: 20, color: tokens.ai }} />
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.ai, mb: 0.5 }}>AI分析建议</Typography>
              <Typography sx={{ fontSize: 13, color: tokens.ink700 }}>
                行业「{item.name}」当前处于【{item.trend?.current}】状态，趋势评分{item.trend?.score || 50}分。
                {item.indicators?.confirmed ? '核心指标已确认趋势，' : '核心指标尚未确认趋势，'}
                建议关注景气度变化与资金流向，等待明确的入场/离场信号后再操作。
              </Typography>
            </Box>
          </Box>
        </Box>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>编辑行业 · {form.name}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="行业名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ flex: 1 }} />
                <TextField label="行业代码" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={{ width: 140 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="行业分级" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ flex: 1 }}>
                  {['一级核心', '二级重点', '三级机会'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
                <TextField select label="当前状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ flex: 1 }}>
                  {['待观察', '趋势确认', '择时入场', '已入场', '已放弃'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Box>
              <Divider />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>趋势状态</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="趋势类型" value={form.trend?.current} onChange={(e) => setForm({ ...form, trend: { ...form.trend, current: e.target.value } })} sx={{ flex: 1 }}>
                  {['上升趋势', '下降趋势', '平稳震荡', '拐点待确认'].map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
                <TextField select label="方向" value={form.trend?.direction} onChange={(e) => setForm({ ...form, trend: { ...form.trend, direction: e.target.value } })} sx={{ width: 120 }}>
                  {['看多', '看空', '中性'].map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
                <TextField label="评分" type="number" value={form.trend?.score ?? ''} onChange={(e) => setForm({ ...form, trend: { ...form.trend, score: Number(e.target.value) } })} sx={{ width: 100 }} />
              </Box>
              <Divider />
              <Typography sx={{ fontSize: 13, fontWeight: 600 }}>景气度指标</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField label="景气评分" type="number" value={form.prosperity?.score ?? ''} onChange={(e) => setForm({ ...form, prosperity: { ...form.prosperity, score: Number(e.target.value) } })} sx={{ width: 100 }} />
                <TextField label="营收增速%" type="number" value={form.prosperity?.revenueGrowth ?? ''} onChange={(e) => setForm({ ...form, prosperity: { ...form.prosperity, revenueGrowth: Number(e.target.value) } })} sx={{ width: 120 }} />
                <TextField label="利润增速%" type="number" value={form.prosperity?.profitGrowth ?? ''} onChange={(e) => setForm({ ...form, prosperity: { ...form.prosperity, profitGrowth: Number(e.target.value) } })} sx={{ width: 120 }} />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="景气变化" value={form.prosperity?.change} onChange={(e) => setForm({ ...form, prosperity: { ...form.prosperity, change: e.target.value } })} sx={{ width: 140 }}>
                  {['上行', '稳定', '下行'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </TextField>
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
        breadcrumb="六层认知体系 / Layer ③ · 行业观察"
        title="行业趋势观察与待操作池"
        subtitle="行业分级管理 · 趋势跟踪 · 择时信号"
      />

      <Box sx={{ p: 3 }}>
        {/* 筛选器 */}
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>状态：</Typography>
          {statuses.map((s) => (
            <Chip key={s} label={s === 'all' ? '全部' : s} size="small"
              color={filterStatus === s ? 'primary' : 'default'}
              variant={filterStatus === s ? 'filled' : 'outlined'}
              onClick={() => setFilterStatus(s)}
            />
          ))}
          <Typography sx={{ fontSize: 13, color: tokens.ink500, ml: 2 }}>分级：</Typography>
          {categories.map((c) => (
            <Chip key={c} label={c === 'all' ? '全部' : c} size="small"
              color={filterCategory === c ? 'info' : 'default'}
              variant={filterCategory === c ? 'filled' : 'outlined'}
              onClick={() => setFilterCategory(c)}
            />
          ))}
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.primary }}>
            新增行业
          </Button>
        </Box>

        {/* 行业列表 */}
        <Grid container spacing={2}>
          {filteredItems.map((item) => (
            <Grid item xs={12} md={6} key={item.id}>
              <Paper
                elevation={0}
                onClick={() => openDetail(item)}
                sx={{
                  p: 2,
                  borderRadius: tokens.radius.md,
                  border: `1px solid ${tokens.border}`,
                  cursor: 'pointer',
                  '&:hover': { borderColor: tokens.primary, boxShadow: 1 },
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {/* 标题行 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 15 }}>{item.name}</Typography>
                    <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 12, color: tokens.ink500 }}>{item.code}</Typography>
                  </Box>
                  <StatusPill label={item.status} tone={STATUS_COLORS[item.status] || 'neutral'} size="sm" />
                </Box>

                {/* 趋势指示器 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <TrendIndicator trend={item.trend?.current || '拐点待确认'} />
                  <Chip label={item.category} size="small" color={CATEGORY_COLORS[item.category] || 'default'} variant="outlined" />
                </Box>

                {/* 景气度概览 */}
                <Box sx={{ p: 1.5, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>景气度</Typography>
                    <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{item.prosperity?.score || 3}/5</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>营收增速</Typography>
                    <Typography sx={{ fontSize: 13, color: (item.prosperity?.revenueGrowth || 0) >= 0 ? tokens.up : tokens.down }}>
                      {item.prosperity?.revenueGrowth != null ? fmtPct(item.prosperity.revenueGrowth) : '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>资金趋势</Typography>
                    <Chip
                      label={item.capitalFlow?.trend || '中性'}
                      size="small"
                      color={item.capitalFlow?.trend === '流入' ? 'success' : item.capitalFlow?.trend === '流出' ? 'warning' : 'default'}
                    />
                  </Box>
                </Box>

                {/* 趋势评分 */}
                <Box>
                  <Typography sx={{ fontSize: 11, color: tokens.ink400, mb: 0.5 }}>趋势评分</Typography>
                  <ScoreBar score={item.trend?.score || 50} />
                </Box>

                {/* 配置建议 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                  <Chip
                    label={item.allocationSuggestion?.type || '观望'}
                    size="small"
                    color={item.allocationSuggestion?.type === '加仓' ? 'success' : item.allocationSuggestion?.type === '减仓' ? 'warning' : 'default'}
                  />
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: tokens.primary }}>
                    建议仓位：{item.allocationSuggestion?.position || 0}%
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {filteredItems.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6, color: tokens.ink400 }}>
            <Typography sx={{ fontSize: 14 }}>暂无行业观察，点击「新增行业」开始建立行业观察池</Typography>
          </Box>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>新增行业观察</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="行业名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="行业代码" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={{ width: 140 }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="行业分级" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ flex: 1 }}>
                {['一级核心', '二级重点', '三级机会'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </TextField>
              <TextField select label="当前状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ flex: 1 }}>
                {['待观察', '趋势确认', '择时入场', '已入场', '已放弃'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
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
