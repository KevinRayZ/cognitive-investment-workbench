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
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/EditOutlined'
import Delete from '@mui/icons-material/DeleteOutline'
import Robot from '@mui/icons-material/SmartToyOutlined'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'
import { createMethod } from '../models/schemas'

const STATUS_TONE = { 启用: 'down', 草稿: 'warn', 待验证: 'neutral' }
const STATUS_DOT = { 启用: tokens.down, 草稿: tokens.warn, 待验证: tokens.ink400 }

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

const EMPTY = createMethod()

export default function MethodL2() {
  const methods = useStore((s) => s.methods)
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [selectedId, setSelectedId] = useState(methods[0]?.id || '')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const selected = methods.find((m) => m.id === selectedId) || methods[0]

  const openNew = () => { setForm({ ...EMPTY }); setOpen(true) }
  const openEdit = (m) => { setForm({ ...m }); setOpen(true) }
  const save = () => {
    if (form.id) update('methods', form.id, form)
    else { const rec = create('methods', { ...form }); setSelectedId(rec.id) }
    setOpen(false)
  }
  const handleDelete = (m) => {
    if (window.confirm(`确定删除方法 ${m.id}？`)) { remove('methods', m.id); if (selectedId === m.id) setSelectedId('') }
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ②"
        title="策略与方法库"
        subtitle="选股 / 估值 / 仓位 / 买卖点 / 风控 等方法；编号 M-YYYY-NNN"
        status={<StatusPill label="启用 / 草稿 / 待验证" tone="ink" />}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.primary }}>新建方法</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        <Stack spacing={1} sx={{ width: 320, flexShrink: 0 }}>
          {methods.map((m) => {
            const active = m.id === selectedId
            return (
              <Box key={m.id} onClick={() => setSelectedId(m.id)} sx={{ p: 1.75, borderRadius: tokens.radius.md, border: `1.5px solid ${active ? tokens.primary : tokens.border}`, bgcolor: active ? tokens.primarySoft : tokens.surface, cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: 2, bgcolor: STATUS_DOT[m.status], flexShrink: 0 }} />
                  <IdBadge id={m.id} size="sm" />
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.ink900 }}>{m.name}</Typography>
              </Box>
            )
          })}
        </Stack>

        {selected ? (
          <Box sx={{ flex: 1, p: 3, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <IdBadge id={selected.id} />
                <StatusPill label={selected.version} tone="neutral" />
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: tokens.ink900 }}>{selected.name}</Typography>
                <StatusPill label={selected.status} tone={STATUS_TONE[selected.status]} />
              </Box>
              <Box>
                <IconButton size="small" onClick={() => openEdit(selected)}><Edit sx={{ fontSize: 18, color: tokens.ink500 }} /></IconButton>
                <IconButton size="small" onClick={() => handleDelete(selected)}><Delete sx={{ fontSize: 18, color: tokens.up }} /></IconButton>
              </Box>
            </Box>

            <Typography sx={{ fontSize: 14, color: tokens.ink700, mt: 2, lineHeight: 1.7 }}>{selected.description || selected.scenario}</Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
              <Meta label="适用场景" value={selected.scenario} />
              <Meta label="前提假设" value={selected.assumptions} />
              <Meta label="关联原则" value={selected.relatedIsIds?.join('、') || '—'} />
            </Box>

            <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mt: 2.5, mb: 1 }}>操作步骤</Typography>
            <Stack spacing={0.75}>
              {(selected.steps || []).map((s, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 20, height: 20, borderRadius: 6, bgcolor: tokens.primarySoft, color: tokens.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</Box>
                  <Typography sx={{ fontSize: 13.5, color: tokens.ink700 }}>{s}</Typography>
                </Box>
              ))}
            </Stack>

            {selected.limitations && (
              <Box sx={{ mt: 2, p: 2, borderRadius: tokens.radius.sm, bgcolor: tokens.warnSoft, border: `1px solid ${tokens.warn}` }}>
                <Typography sx={{ fontSize: 12, color: '#9A6700', fontWeight: 600, mb: 0.5 }}>局限性</Typography>
                <Typography sx={{ fontSize: 13, color: tokens.ink700 }}>{selected.limitations}</Typography>
              </Box>
            )}

            <Box sx={{ mt: 2 }}>
              <AiBox>{`建议：该方法当前状态「${selected.status}」，关联 ${(selected.relatedIsIds || []).length} 条原则。启用前建议补充至少 1 条原则引用并完成回测验证。`}</AiBox>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, p: 4, textAlign: 'center', color: tokens.ink400 }}>暂无方法，点击「新建方法」开始。</Box>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? `编辑方法 ${form.id}` : '新建方法'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="方法名称" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="版本" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} sx={{ width: 140 }} />
              <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ flex: 1 }}>
                {['启用', '草稿', '待验证'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <TextField label="适用场景" value={form.scenario} onChange={(e) => setForm({ ...form, scenario: e.target.value })} multiline minRows={2} fullWidth />
            <TextField label="前提假设" value={form.assumptions} onChange={(e) => setForm({ ...form, assumptions: e.target.value })} fullWidth />
            <TextField label="操作步骤（每行一条）" value={(form.steps || []).join('\n')} onChange={(e) => setForm({ ...form, steps: e.target.value.split('\n').filter(Boolean) })} multiline minRows={3} fullWidth />
            <TextField label="局限性" value={form.limitations} onChange={(e) => setForm({ ...form, limitations: e.target.value })} fullWidth />
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
      <Typography sx={{ fontSize: 13.5, color: tokens.ink700 }}>{value || '—'}</Typography>
    </Box>
  )
}
