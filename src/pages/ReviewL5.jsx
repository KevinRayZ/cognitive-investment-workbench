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
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/EditOutlined'
import Delete from '@mui/icons-material/DeleteOutline'
import Robot from '@mui/icons-material/SmartToyOutlined'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'
import { fmtDate } from '../utils/formatters'
import { createReview } from '../models/schemas'

const CAT_DOT = { 认知: tokens.up, 心态: tokens.warn, 执行: tokens.up }
const CAT_TONE = { 认知: 'up', 心态: 'warn', 执行: 'up' }

function AiBox({ children }) {
  return (
    <Box sx={{ bgcolor: tokens.aiSoft, border: `1px solid ${tokens.ai}`, borderRadius: tokens.radius.md, p: 1.75 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
        <Box sx={{ bgcolor: tokens.ai, color: '#fff', borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700 }}>AI</Box>
        <Robot sx={{ fontSize: 15, color: tokens.ai }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.ai }}>AI 校验建议（静态占位）</Typography>
      </Box>
      <Typography sx={{ fontSize: 13, color: tokens.ink700 }}>{children}</Typography>
    </Box>
  )
}

const EMPTY = createReview()

export default function ReviewL5() {
  const reviews = useStore((s) => s.reviews)
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [tab, setTab] = useState('错误清单')
  const [selectedId, setSelectedId] = useState(reviews.find((r) => r.type === '错误清单')?.id || '')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const list = reviews.filter((r) => r.type === tab)
  const selected = reviews.find((r) => r.id === selectedId) || list[0]

  const openNew = () => { setForm({ ...EMPTY, type: tab }); setOpen(true) }
  const openEdit = (r) => { setForm({ ...r }); setOpen(true) }
  const save = () => {
    if (form.id) update('reviews', form.id, form)
    else { const rec = create('reviews', { ...form }); setSelectedId(rec.id) }
    setOpen(false)
  }
  const handleDelete = (r) => { if (window.confirm(`确定删除「${r.title}」？`)) { remove('reviews', r.id); if (selectedId === r.id) setSelectedId('') } }

  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ⑤"
        title="复盘与错误清单"
        subtitle="交易复盘 + 可累积错误库（稳定 ERR-ID）"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.primary }}>新建条目</Button>}
      />

      <Box sx={{ px: 3, pt: 2 }}>
        <ToggleButtonGroup value={tab} exclusive onChange={(e, v) => v && setTab(v)} size="small">
          <ToggleButton value="错误清单" sx={{ textTransform: 'none' }}>错误清单</ToggleButton>
          <ToggleButton value="交易复盘" sx={{ textTransform: 'none' }}>交易复盘</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Box sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Stack spacing={1} sx={{ width: 320, flexShrink: 0 }}>
          {list.map((r) => {
            const active = r.id === selectedId
            return (
              <Box key={r.id} onClick={() => setSelectedId(r.id)} sx={{ p: 1.75, borderRadius: tokens.radius.md, border: `1.5px solid ${active ? tokens.primary : tokens.border}`, bgcolor: active ? tokens.primarySoft : tokens.surface, cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {r.type === '错误清单' && <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: CAT_DOT[r.category] || tokens.ink400, flexShrink: 0 }} />}
                  {r.errId && <IdBadge id={r.errId} size="sm" />}
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.ink900 }}>{r.title}</Typography>
              </Box>
            )
          })}
        </Stack>

        {selected ? (
          <Box sx={{ flex: 1, p: 3, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {selected.errId && <IdBadge id={selected.errId} />}
                {selected.type === '错误清单' && <StatusPill label={`${selected.category}类`} tone={CAT_TONE[selected.category]} />}
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: tokens.ink900 }}>{selected.title}</Typography>
                <StatusPill label={selected.status} tone={selected.status === '已验证' ? 'down' : 'warn'} />
              </Box>
              <Box>
                <IconButton size="small" onClick={() => openEdit(selected)}><Edit sx={{ fontSize: 18, color: tokens.ink500 }} /></IconButton>
                <IconButton size="small" onClick={() => handleDelete(selected)}><Delete sx={{ fontSize: 18, color: tokens.up }} /></IconButton>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 14, color: tokens.ink700, mt: 2, lineHeight: 1.7 }}>{selected.description}</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
              <Meta label="分类" value={selected.category} />
              <Meta label="首次发生" value={fmtDate(selected.reviewRecords?.[0]?.date) || '—'} />
              <Meta label="累计次数" value={`${selected.reviewRecords?.length || 0} 次`} />
            </Box>

            {selected.relatedIsIds?.length > 0 && (
              <Box sx={{ mt: 2, p: 2, borderRadius: tokens.radius.sm, bgcolor: tokens.warnSoft, border: `1px solid ${tokens.warn}` }}>
                <Typography sx={{ fontSize: 12, color: '#9A6700', fontWeight: 600, mb: 0.75 }}>关联原则</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {selected.relatedIsIds.map((id) => <IdBadge key={id} id={id} size="sm" />)}
                </Stack>
              </Box>
            )}

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mt: 2.5, mb: 1 }}>复盘记录</Typography>
            <Stack spacing={0.75}>
              {(selected.reviewRecords || []).map((rec, i) => (
                <Box key={i} sx={{ p: 1.5, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                    <Typography sx={{ fontSize: 12, fontFamily: '"Roboto Mono", monospace', color: tokens.ink400 }}>{fmtDate(rec.date)}</Typography>
                    <StatusPill label={rec.result} tone={rec.result?.includes('盈') || rec.result?.includes('证') ? 'down' : 'neutral'} size="sm" />
                  </Box>
                  <Typography sx={{ fontSize: 13, color: tokens.ink700 }}>{rec.content}</Typography>
                </Box>
              ))}
              {(selected.reviewRecords || []).length === 0 && <Typography sx={{ fontSize: 13, color: tokens.ink400 }}>暂无复盘记录。</Typography>}
            </Stack>

            <Box sx={{ mt: 2 }}>
              <AiBox>{`建议：该${selected.type === '错误清单' ? '错误' : '复盘'}已${selected.status === '已验证' ? '验证' : '待验证'}，累计 ${(selected.reviewRecords || []).length} 次记录。${
                selected.relatedIsIds?.length ? '已关联原则，建议回灌校准体系。' : '建议补充关联原则编号以增强可追溯性。'
              }`}</AiBox>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, p: 4, textAlign: 'center', color: tokens.ink400 }}>暂无条目。</Box>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? '编辑条目' : `新建${tab}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            {form.type === '错误清单' ? (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField select label="分类" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ flex: 1 }}>
                  {['认知', '心态', '执行'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
                <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ flex: 1 }}>
                  {['待验证', '已验证'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Box>
            ) : (
              <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['待验证', '已验证'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            )}
            <TextField label="描述" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline minRows={3} fullWidth />
            <TextField label="关联原则 ID（逗号分隔）" value={(form.relatedIsIds || []).join(', ')} onChange={(e) => setForm({ ...form, relatedIsIds: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} fullWidth />
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

function Meta({ label, value }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}` }}>
      <Typography sx={{ fontSize: 12, color: tokens.ink400, mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, color: tokens.ink700 }}>{value}</Typography>
    </Box>
  )
}
