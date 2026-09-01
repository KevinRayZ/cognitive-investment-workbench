import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/EditOutlined'
import Delete from '@mui/icons-material/DeleteOutline'
import Robot from '@mui/icons-material/SmartToyOutlined'
import ArrowBack from '@mui/icons-material/ArrowBack'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'
import KpiCard from '../components/KpiCard'
import { fmtCurrency, fmtPct } from '../utils/formatters'
import { createTarget } from '../models/schemas'
import { buildDefaultTargetState, DIRECTIONS, DIRECTION_TONE, STATE_TONE } from '../utils/direction'

const STAGE_TONE = { 深度: 'primary', 研究中: 'ai', 跟踪中: 'neutral' }

function AiBox({ children }) {
  return (
    <Box sx={{ bgcolor: tokens.aiSoft, border: `1px solid ${tokens.ai}`, borderRadius: tokens.radius.md, p: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <Box sx={{ bgcolor: tokens.ai, color: '#fff', borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700 }}>AI</Box>
        <Robot sx={{ fontSize: 15, color: tokens.ai }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.ai }}>AI 视角（静态占位）</Typography>
      </Box>
      <Typography sx={{ fontSize: 13, color: tokens.ink700 }}>{children}</Typography>
    </Box>
  )
}

const EMPTY = createTarget()

export default function TargetL3() {
  const { code } = useParams()
  const navigate = useNavigate()
  const targets = useStore((s) => s.targets)
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)
  const targetStates = useStore((s) => s.targetStates) || []
  const upsertTargetState = useStore((s) => s.upsertTargetState)
  const confirmTargetState = useStore((s) => s.confirmTargetState)
  const analysis = useStore((s) => s.analysis)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const target = code ? targets.find((t) => t.code === code) : null

  // 注意：列表视图（提前 return）也会用到 openNew，必须声明在 return 之前，
  // 否则命中 TDZ（Cannot access 'openNew' before initialization）导致整页崩溃。
  const openNew = () => { setForm({ ...EMPTY }); setOpen(true) }

  // 无 code 或无匹配 → 列表视图
  if (!code || !target) {
    return (
      <Box>
        <PageHeader breadcrumb="六层认知体系 / Layer ③" title="行业与标的研究" subtitle="个股 / 行业 / 基金 标准化研究档案" />
        <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)' }, gap: 2 }}>
          {targets.map((t) => (
            <Box key={t.id} onClick={() => navigate(`/research/${t.code}`)} sx={{ p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, cursor: 'pointer', '&:hover': { borderColor: tokens.primary } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 16 }}>{t.name}</Typography>
                <StatusPill label={t.stage} tone={STAGE_TONE[t.stage]} size="sm" />
              </Box>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 13, color: tokens.ink500, mt: 0.25 }}>{t.code}</Typography>
              <Typography sx={{ fontSize: 13, color: tokens.ink500, mt: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{t.businessModel}</Typography>
            </Box>
          ))}
          <Box onClick={openNew} sx={{ p: 2.5, borderRadius: tokens.radius.md, border: `1.5px dashed ${tokens.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: tokens.primary, cursor: 'pointer' }}>
            <Add /> 新建研究
          </Box>
        </Box>
      </Box>
    )
  }

  const kf = target.keyFinancials || {}
  const pct = kf.currentPercentile
  const pctCold = typeof pct === 'number' && pct <= 40

  // 标的动态方向建议（状态机 §3.5 C5）
  const ts = targetStates.find((x) => x.targetId === target.id)
  const ai = analysis?.targets?.[target.code]
  const genDirection = () => {
    const base = buildDefaultTargetState(target)
    upsertTargetState(target.id, {
      ...base,
      direction: ai?.direction || base.direction,
      directionReason: ai?.directionReason || ai?.thesis || '基于 AI 分析缓存与状态机默认，供人类参考。',
      confidence: ai ? (ai.confidence === '高' ? 75 : ai.confidence === '中' ? 55 : 40) : 50,
      prevState: ts?.state || base.state,
    })
  }

  const openEdit = () => { setForm({ ...target }); setOpen(true) }
  const save = () => {
    if (form.id) update('targets', form.id, form)
    else { const rec = create('targets', { ...form }); navigate(`/research/${rec.code}`) }
    setOpen(false)
  }
  const handleDelete = () => { if (window.confirm(`确定删除研究 ${target.code}？`)) { remove('targets', target.id); navigate('/research') } }

  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ③"
        title={`${target.name} · ${target.code}`}
        subtitle="标的研究档案"
        status={<StatusPill label={`研究阶段 · ${target.stage}`} tone="primary" />}
        actions={
          <>
            <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/research')} sx={{ color: tokens.ink500, borderColor: tokens.border }}>列表</Button>
            <IconButton onClick={openEdit}><Edit sx={{ fontSize: 18, color: tokens.ink500 }} /></IconButton>
            <IconButton onClick={handleDelete}><Delete sx={{ fontSize: 18, color: tokens.up }} /></IconButton>
          </>
        }
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <KpiCard label="当前价" value={kf.currentPrice != null ? fmtCurrency(kf.currentPrice, target.currency) : '—'} accent={tokens.ink900} />
          <KpiCard label="TTM-PE 分位" value={pct != null ? fmtPct(pct) : '—'} accent={pctCold ? tokens.ai : tokens.warn} />
          <KpiCard label="ROE" value={kf.roe != null ? fmtPct(kf.roe) : '—'} accent={tokens.primary} />
          <KpiCard label="市值" value={kf.marketCap || '—'} accent={tokens.ink900} />
        </Box>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: 2, minWidth: 280 }}>
            <Section title="商业模式" body={target.businessModel} />
            <Section title="护城河" body={target.moat} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 240 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mb: 1 }}>估值分位</Typography>
            <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, textAlign: 'center' }}>
              <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 34, fontWeight: 700, color: pctCold ? tokens.ai : tokens.warn }}>{pct != null ? fmtPct(pct, 0) : '—'}</Typography>
              <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>{pctCold ? '冷区 · 安全边际充足' : '热区 · 注意追高风险'}</Typography>
            </Box>
            <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
              {(target.valuationRange?.tiers || []).map((t, i) => {
                const cur = typeof pct === 'number' ? Math.min(4, Math.floor(pct / 20)) : -1
                const active = i === cur
                return (
                  <Box key={t} sx={{ flex: 1, textAlign: 'center', py: 0.75, borderRadius: 1, fontSize: 11, fontWeight: 600, bgcolor: active ? tokens.primary : tokens.bgPage, color: active ? '#fff' : tokens.ink400 }}>
                    {t}
                  </Box>
                )
              })}
            </Stack>
          </Box>
        </Box>

        <AiBox>{`静态占位：当前估值分位 ${pct != null ? fmtPct(pct, 0) : '未知'}，处于${pctCold ? '冷区' : '偏热区'}。建议先判断标的是价值型还是成长型，按对应策略（M-2026-002 价值 / M-2026-003 GARP）交叉验证后再决策，并引用 IS-2026-003（价值为锚）与 IS-2026-002（能力圈）。`}</AiBox>

        {/* 标的动态方向建议（状态机 + 触发 + 纪律 + 置信度） */}
        <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderTop: `3px solid ${tokens.primary}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1.25 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink900 }}>动态方向建议</Typography>
            {ts ? (
              <>
                <StatusPill label={`状态 · ${ts.state}`} tone={STATE_TONE[ts.state] || 'neutral'} size="sm" />
                <StatusPill label={`方向 · ${ts.direction}`} tone={DIRECTION_TONE[ts.direction] || 'hold'} size="sm" />
                <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>置信 {ts.confidence}/100 · {ts.updatedBy === 'human-confirmed' ? '人工确认' : '自动'}</Typography>
              </>
            ) : (
              <Button size="small" variant="outlined" onClick={genDirection} sx={{ color: tokens.primary, borderColor: tokens.primary }}>生成方向建议</Button>
            )}
          </Box>

          {ts ? (
            <Stack spacing={1}>
              <Typography sx={{ fontSize: 12.5, color: tokens.ink700 }}>{ts.directionReason || '暂无依据说明。'}</Typography>
              {(ts.triggers || []).length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: tokens.ink500 }}>触发条件</Typography>
                  <Stack spacing={0.3}>
                    {(ts.triggers || []).map((t, i) => (
                      <Typography key={i} sx={{ fontSize: 12, color: tokens.ink700 }}>· {t.condition}（{t.status || '待观察'}）</Typography>
                    ))}
                  </Stack>
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: tokens.ink500 }}>纪律校验：</Typography>
                {ts.discipline?.l7Pass === false ? <StatusPill label="L7 未通过" tone="warn" size="sm" /> : <StatusPill label="L7 通过" tone="down" size="sm" />}
                {ts.discipline?.stopLossHit ? <StatusPill label="止损触发" tone="warn" size="sm" /> : null}
                {ts.discipline?.positionLimit?.max ? <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>仓位参考 {ts.discipline.positionLimit.min}~{ts.discipline.positionLimit.max}%</Typography> : null}
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={genDirection} sx={{ color: tokens.ink500, borderColor: tokens.border }}>刷新</Button>
                  <Button size="small" variant="contained" onClick={() => confirmTargetState(target.id, ts.direction)} sx={{ bgcolor: tokens.primary }}>确认方向</Button>
                </Box>
              </Box>
            </Stack>
          ) : (
            <Typography sx={{ fontSize: 12.5, color: tokens.ink400 }}>尚未生成。方向仅建议级，最终决策与执行权在你。</Typography>
          )}
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#9A6700', mb: 1 }}>关键风险</Typography>
          <Stack spacing={0.75}>
            {(target.riskPoints || []).map((r, i) => (
              <Box key={i} sx={{ p: 1.5, borderRadius: tokens.radius.sm, bgcolor: tokens.warnSoft, border: `1px solid ${tokens.warn}`, fontSize: 13, color: tokens.ink700 }}>{r}</Box>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mb: 1 }}>跟踪要点</Typography>
          <Stack spacing={0.5}>
            {(target.trackingPoints || []).map((t, i) => (
              <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center', fontSize: 13.5, color: tokens.ink700 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: 1, bgcolor: tokens.primary }} /> {t}
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: 12, color: tokens.ink400, mb: 0.5 }}>关联原则</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {(target.relatedIsIds || []).map((id) => <IdBadge key={id} id={id} size="sm" />)}
            </Stack>
          </Box>
          <Box>
            <Typography sx={{ fontSize: 12, color: tokens.ink400, mb: 0.5 }}>关联错误</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {(target.relatedErrIds || []).map((id) => <IdBadge key={id} id={id} size="sm" />)}
            </Stack>
          </Box>
        </Box>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑研究 · {form.code}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="代码" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} sx={{ width: 140 }} />
            </Box>
            <TextField select label="研究阶段" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {['研究中', '深度', '跟踪中'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </TextField>
            <TextField label="商业模式" value={form.businessModel} onChange={(e) => setForm({ ...form, businessModel: e.target.value })} multiline minRows={2} fullWidth />
            <TextField label="护城河" value={form.moat} onChange={(e) => setForm({ ...form, moat: e.target.value })} multiline minRows={2} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="当前价" type="number" value={form.keyFinancials.currentPrice ?? ''} onChange={(e) => setForm({ ...form, keyFinancials: { ...form.keyFinancials, currentPrice: Number(e.target.value) } })} sx={{ width: 120 }} />
              <TextField label="PE 分位 %" type="number" value={form.keyFinancials.currentPercentile ?? ''} onChange={(e) => setForm({ ...form, keyFinancials: { ...form.keyFinancials, currentPercentile: Number(e.target.value) } })} sx={{ width: 120 }} />
              <TextField label="ROE %" type="number" value={form.keyFinancials.roe ?? ''} onChange={(e) => setForm({ ...form, keyFinancials: { ...form.keyFinancials, roe: Number(e.target.value) } })} sx={{ width: 120 }} />
            </Box>
            <TextField label="风险点（每行一条）" value={(form.riskPoints || []).join('\n')} onChange={(e) => setForm({ ...form, riskPoints: e.target.value.split('\n').filter(Boolean) })} multiline minRows={3} fullWidth />
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

function Section({ title, body }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mb: 0.75 }}>{title}</Typography>
      <Typography sx={{ fontSize: 13.5, color: tokens.ink700, lineHeight: 1.7 }}>{body || '—'}</Typography>
    </Box>
  )
}
