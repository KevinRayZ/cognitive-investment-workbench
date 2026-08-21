import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/EditOutlined'
import Delete from '@mui/icons-material/DeleteOutline'
import WarningAmber from '@mui/icons-material/WarningAmber'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import KpiCard from '../components/KpiCard'
import StatusPill from '../components/StatusPill'
import BoundaryAlert from '../components/BoundaryAlert'
import { fmtDate, fmtCurrency, fmtSignedCurrency } from '../utils/formatters'
import { checkPosition } from '../utils/validators'
import { createTrade } from '../models/schemas'

const STATUS_TONE = { 已归档: 'neutral', 已平仓: 'down', '边界外·待核': 'warn' }

const EMPTY = createTrade()

export default function TradeLogL4() {
  const trades = useStore((s) => s.trades)
  const memos = useStore((s) => s.memos)
  const kpis = useStore((s) => s.getTradeKpis())
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  // 仓位硬规则统计
  const posStats = trades.map((t) => ({ t, ...checkPosition(t, trades) }))
  const maxSingle = posStats.reduce((m, x) => Math.max(m, x.singlePct), 0)
  const maxIndustry = posStats.reduce((m, x) => Math.max(m, x.industryPct), 0)
  const breach = maxSingle > 20 || maxIndustry > 40

  const openNew = () => { setForm({ ...EMPTY, date: fmtDate(new Date().toISOString().slice(0, 10)) ? new Date().toISOString().slice(0, 10) : '' }); setOpen(true) }
  const openEdit = (t) => { setForm({ ...t }); setOpen(true) }
  const save = () => {
    const payload = { ...form, amount: Number(form.quantity) * Number(form.price) }
    if (form.id) update('trades', form.id, payload)
    else create('trades', payload)
    setOpen(false)
  }
  const handleDelete = (t) => { if (window.confirm(`确定删除交易 ${t.targetName}（${t.date}）？`)) remove('trades', t.id) }

  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ④"
        title="交易决策日志"
        subtitle="每笔买卖的完整记录 + 决策依据（仅人工录入）"
        status={<StatusPill label="AI 无交易决策权" tone="up" />}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.primary }}>录入交易</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <KpiCard label="本月交易" value={kpis.total} />
          <KpiCard label="胜率" value={`${kpis.winRate.toFixed(1)}%`} accent={tokens.primary} />
          <KpiCard label="边界外" value={kpis.boundary} accent={kpis.boundary ? tokens.warn : tokens.ink900} />
          <KpiCard label="累计盈亏" value={fmtSignedCurrency(kpis.cumulative)} accent={kpis.cumulative >= 0 ? tokens.up : tokens.down} />
        </Box>

        <BoundaryAlert>
          AI 无任何自主交易决策权：交易记录仅限人工录入，AI 不得生成或替用户填写交易行；边界外记录须人工复核后方可解除警告态。
        </BoundaryAlert>

        {breach ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.warnSoft, border: `1px solid ${tokens.warn}`, color: '#9A6700', fontSize: 13.5 }}>
            <WarningAmber sx={{ fontSize: 18, color: tokens.warn }} />
            <span>仓位硬规则预警：单票上限 20%（当前峰值 {maxSingle.toFixed(1)}%），单一行业 ≤ 40%（当前峰值 {maxIndustry.toFixed(1)}%）。超限需人工复核并记录。</span>
          </Box>
        ) : (
          <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: '#E6F4EC', color: tokens.down, fontSize: 13.5 }}>
            仓位硬规则校验通过：单票峰值 {maxSingle.toFixed(1)}% ≤ 20%，行业峰值 {maxIndustry.toFixed(1)}% ≤ 40%。
          </Box>
        )}

        <Box sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: tokens.bgPage }}>
                {['日期', '标的', '方向', '数量', '成交价', '金额', '关联备忘录', '状态'].map((h) => (
                  <TableCell key={h} sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink700 }}>{h}</TableCell>
                ))}
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {trades.map((t) => (
                <TableRow key={t.id} sx={{ bgcolor: t.isOutOfBoundary ? tokens.warnSoft : 'transparent', '& td': { fontSize: 13, color: tokens.ink700, py: 1.25 } }}>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>{fmtDate(t.date)}</TableCell>
                  <TableCell>{t.targetName}</TableCell>
                  <TableCell>
                    <Typography component="span" sx={{ color: t.direction === '做多' ? tokens.up : tokens.down, fontWeight: 600 }}>{t.direction}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>{t.quantity}</TableCell>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>{fmtCurrency(t.price, t.currency)}</TableCell>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>{fmtCurrency(t.amount, t.currency)}</TableCell>
                  <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 12 }}>{t.memoId || '—'}</TableCell>
                  <TableCell><StatusPill label={t.status} tone={STATUS_TONE[t.status]} size="sm" /></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => openEdit(t)}><Edit sx={{ fontSize: 16, color: tokens.ink500 }} /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(t)}><Delete sx={{ fontSize: 16, color: tokens.up }} /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? '编辑交易' : '录入交易（人工）'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="日期" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ flex: 1 }} />
              <TextField select label="方向" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })} sx={{ width: 120 }}>
                {['做多', '做空'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <TextField label="标的名称" value={form.targetName} onChange={(e) => setForm({ ...form, targetName: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="数量" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} sx={{ flex: 1 }} />
              <TextField label="成交价" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} sx={{ flex: 1 }} />
              <TextField select label="币种" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} sx={{ width: 110 }}>
                {['CNY', 'HKD', 'USD'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="行业" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} sx={{ flex: 1 }} />
              <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ width: 150 }}>
                {['已归档', '已平仓', '边界外·待核'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <TextField select label="关联备忘录" value={form.memoId} onChange={(e) => setForm({ ...form, memoId: e.target.value })}>
              <MenuItem value="">无</MenuItem>
              {memos.map((m) => <MenuItem key={m.id} value={m.id}>{m.id} · {m.targetName}</MenuItem>)}
            </TextField>
            <TextField label="平仓盈亏（可选）" type="number" value={form.profit ?? ''} onChange={(e) => setForm({ ...form, profit: e.target.value === '' ? undefined : Number(e.target.value) })} />
            <TextField label="市场环境" value={form.decisionContext.marketEnvironment} onChange={(e) => setForm({ ...form, decisionContext: { ...form.decisionContext, marketEnvironment: e.target.value } })} fullWidth />
            <TextField label="估值情况" value={form.decisionContext.valuation} onChange={(e) => setForm({ ...form, decisionContext: { ...form.decisionContext, valuation: e.target.value } })} fullWidth />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>边界外（需人工复核）</Typography>
              <Button size="small" variant={form.isOutOfBoundary ? 'contained' : 'outlined'} color="warning" onClick={() => setForm({ ...form, isOutOfBoundary: !form.isOutOfBoundary })} sx={{ textTransform: 'none' }}>
                {form.isOutOfBoundary ? '是' : '否'}
              </Button>
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
