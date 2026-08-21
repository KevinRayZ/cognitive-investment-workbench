import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Add from '@mui/icons-material/Add'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'
import { fmtDate } from '../utils/formatters'
import { createObservation } from '../models/schemas'

const SRC_TONE = { 突发: 'warn', 研报: 'primary', 公众号: 'ai', 新闻: 'neutral', 灵感: 'primary' }
const STATUS_TONE = { 待归档: 'warn', 已归档: 'down' }

const EMPTY = createObservation()

export default function ObservationL6() {
  const navigate = useNavigate()
  const observations = useStore((s) => s.observations)
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [filter, setFilter] = useState('全部')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const counts = {
    全部: observations.length,
    待归档: observations.filter((o) => o.status === '待归档').length,
    已归档: observations.filter((o) => o.status === '已归档').length,
  }
  const list = filter === '全部' ? observations : observations.filter((o) => o.status === filter)

  const openNew = () => { setForm({ ...EMPTY, createdAt: new Date().toISOString().slice(0, 10), status: '待归档' }); setOpen(true) }
  const save = () => {
    if (form.id) update('observations', form.id, form)
    else create('observations', form)
    setOpen(false)
  }
  const toggleArchive = (o) => update('observations', o.id, { status: o.status === '待归档' ? '已归档' : '待归档' })
  const handleDelete = (o) => { if (window.confirm(`确定删除灵感「${o.title}」？`)) remove('observations', o.id) }

  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ⑥"
        title="市场观察与灵感"
        subtitle="宏观 / 行业 / 突发 / 灵感池（待归档 → 已归档）"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.ai }}>记录新灵感</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {['全部', '待归档', '已归档'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'contained' : 'outlined'}
              onClick={() => setFilter(f)}
              sx={{
                textTransform: 'none',
                borderRadius: 0,
                bgcolor: filter === f ? (f === '待归档' ? tokens.warn : f === '已归档' ? tokens.down : tokens.primary) : 'transparent',
                color: filter === f ? '#fff' : tokens.ink500,
                borderColor: tokens.border,
              }}
            >
              {f} {counts[f]}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {list.map((o) => (
            <Box key={o.id} sx={{ p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <StatusPill label={o.sourceType} tone={SRC_TONE[o.sourceType]} size="sm" />
                <StatusPill label={o.status} tone={STATUS_TONE[o.status]} size="sm" />
              </Box>
              <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 15 }}>{o.title}</Typography>
              <Typography sx={{ fontSize: 13, color: tokens.ink500, lineHeight: 1.6, flex: 1 }}>{o.summary}</Typography>
              <Typography sx={{ fontSize: 12, color: tokens.ink400, fontFamily: '"Roboto Mono", monospace' }}>{fmtDate(o.createdAt)} · {o.source}</Typography>
              {(o.relatedTargetIds?.length > 0 || o.relatedMethodIds?.length > 0 || o.relatedErrIds?.length > 0) && (
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.75}>
                  {[...(o.relatedTargetIds || []), ...(o.relatedMethodIds || []), ...(o.relatedErrIds || [])].map((id) => <IdBadge key={id} id={id} size="sm" />)}
                </Stack>
              )}
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <Button size="small" variant="text" onClick={() => toggleArchive(o)} sx={{ color: tokens.primary, textTransform: 'none' }}>
                  {o.status === '待归档' ? '归档' : '取消归档'}
                </Button>
                <Button size="small" variant="text" color="error" onClick={() => handleDelete(o)} sx={{ textTransform: 'none' }}>删除</Button>
              </Box>
            </Box>
          ))}
          {list.length === 0 && <Typography sx={{ color: tokens.ink400, gridColumn: '1 / -1', p: 3, textAlign: 'center' }}>该分类下暂无灵感。</Typography>}
        </Box>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>记录新灵感</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="来源类型" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })} sx={{ flex: 1 }}>
                {['突发', '研报', '公众号', '新闻', '灵感'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ flex: 1 }}>
                {['待归档', '已归档'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <TextField label="来源" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} fullWidth />
            <TextField label="摘要" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} multiline minRows={3} fullWidth />
            <TextField label="关联 ID（逗号分隔，可选）" value={[...(form.relatedTargetIds || []), ...(form.relatedMethodIds || []), ...(form.relatedErrIds || [])].join(', ')} onChange={(e) => {
              const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
              setForm({ ...form, relatedTargetIds: arr, relatedMethodIds: arr, relatedErrIds: arr })
            }} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: tokens.ai }}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
