import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
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
import PrincipleL1 from './PrincipleL1'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'
import { createIS } from '../models/schemas'

function AiBox({ children }) {
  return (
    <Box sx={{ bgcolor: tokens.aiSoft, border: `1px solid ${tokens.ai}`, borderRadius: tokens.radius.md, p: 1.75, position: 'relative' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <Box sx={{ bgcolor: tokens.ai, color: '#fff', borderRadius: 1, px: 0.75, py: 0.1, fontSize: 11, fontWeight: 700 }}>AI</Box>
        <Robot sx={{ fontSize: 15, color: tokens.ai }} />
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: tokens.ai }}>AI 校验建议（静态占位）</Typography>
      </Box>
      <Typography sx={{ fontSize: 13, color: tokens.ink700, lineHeight: 1.6 }}>{children}</Typography>
    </Box>
  )
}

const EMPTY = createIS()

export default function PrincipleIS() {
  const [params] = useSearchParams()
  if (params.get('view') === 'l1') return <PrincipleL1 />

  const principles = useStore((s) => s.principles)
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [selectedId, setSelectedId] = useState(principles[0]?.id || '')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const selected = principles.find((p) => p.id === selectedId) || principles[0]

  const openNew = () => {
    setForm({ ...EMPTY })
    setOpen(true)
  }
  const openEdit = (p) => {
    setForm({ ...p })
    setOpen(true)
  }
  const save = () => {
    if (form.id) {
      update('principles', form.id, form)
    } else {
      const rec = create('principles', { ...form, status: form.status || '草稿' })
      setSelectedId(rec.id)
    }
    setOpen(false)
  }
  const handleDelete = (p) => {
    if (window.confirm(`确定删除原则 ${p.id}？`)) {
      remove('principles', p.id)
      if (selectedId === p.id) setSelectedId('')
    }
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="六层认知体系 / Layer ①"
        title="原则卡片 IS"
        subtitle="唯一权威原则源（增删改）；编号 IS-YYYY-NNN，可被备忘录引用"
        status={<StatusPill label="已采纳 / 草稿 / 已弃用" tone="primary" />}
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.primary }}>新建原则</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* 左：原则库列表 */}
        <Stack spacing={1} sx={{ width: 320, flexShrink: 0 }}>
          {principles.map((p) => {
            const active = p.id === selectedId
            return (
              <Box
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                sx={{
                  p: 1.75,
                  borderRadius: tokens.radius.md,
                  border: `1.5px solid ${active ? tokens.primary : tokens.border}`,
                  bgcolor: active ? tokens.primarySoft : tokens.surface,
                  cursor: 'pointer',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <IdBadge id={p.id} size="sm" />
                  {p.isConstitution && <StatusPill label="宪法级" tone="up" size="sm" />}
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 600, color: tokens.ink900 }}>{p.title}</Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusPill label={p.status} tone={p.status === '已采纳' ? 'down' : 'neutral'} size="sm" />
                </Box>
              </Box>
            )
          })}
        </Stack>

        {/* 右：详情卡 */}
        {selected ? (
          <Box sx={{ flex: 1, p: 3, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <IdBadge id={selected.id} />
                {selected.isConstitution && <StatusPill label="宪法级" tone="up" />}
                <Typography sx={{ fontSize: 20, fontWeight: 700, color: tokens.ink900 }}>{selected.title}</Typography>
                <StatusPill label={`${selected.confidence}% 置信`} tone="primary" />
              </Box>
              <Box>
                <IconButton size="small" onClick={() => openEdit(selected)}><Edit sx={{ fontSize: 18, color: tokens.ink500 }} /></IconButton>
                <IconButton size="small" onClick={() => handleDelete(selected)}><Delete sx={{ fontSize: 18, color: tokens.up }} /></IconButton>
              </Box>
            </Box>

            <Box sx={{ mt: 2, p: 2, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}` }}>
              <Typography sx={{ fontSize: 12, color: tokens.ink400, mb: 0.5 }}>原则陈述</Typography>
              <Typography sx={{ fontSize: 14, color: tokens.ink700, lineHeight: 1.7 }}>{selected.statement}</Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mt: 2 }}>
              <Meta label="来源 / 出处" value={selected.source} />
              <Meta label="适用范围" value={selected.scope} />
              <Meta label="验证计划" value={selected.validationPlan} />
            </Box>

            <Box sx={{ mt: 2 }}>
              <AiBox>{`建议：该原则与 ${selected.relatedErrIds?.length || 0} 条错误记录关联，置信度 ${selected.confidence}%。如发生反向证据，请触发知识晶体化流程更新版本。`}</AiBox>
            </Box>

            {selected.relatedErrIds?.length > 0 && (
              <Box sx={{ mt: 2, p: 2, borderRadius: tokens.radius.sm, bgcolor: tokens.warnSoft, border: `1px solid ${tokens.warn}` }}>
                <Typography sx={{ fontSize: 12, color: '#9A6700', fontWeight: 600, mb: 0.75 }}>关联错误</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {selected.relatedErrIds.map((e) => (
                    <IdBadge key={e} id={e} size="sm" />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ flex: 1, p: 4, textAlign: 'center', color: tokens.ink400 }}>暂无原则卡片，点击「新建原则」开始。</Box>
        )}
      </Box>

      {/* 编辑 / 新建对话框 */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{form.id ? `编辑原则 ${form.id}` : '新建原则卡片'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="模块" value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} sx={{ flex: 1 }}>
                {['投资哲学', '估值纪律', '风险管理', '选股', '其他'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              <TextField select label="类别" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} sx={{ flex: 1 }}>
                {['宪法级', '可复用', '工作流'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="置信度 %" type="number" value={form.confidence} onChange={(e) => setForm({ ...form, confidence: Number(e.target.value) })} sx={{ width: 140 }} />
              <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} sx={{ flex: 1 }}>
                {['草稿', '已采纳', '已弃用'].map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
            </Box>
            <TextField label="原则陈述" value={form.statement} onChange={(e) => setForm({ ...form, statement: e.target.value })} multiline minRows={2} fullWidth />
            <TextField label="来源 / 出处" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} fullWidth />
            <TextField label="适用范围" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} fullWidth />
            <TextField label="验证计划" value={form.validationPlan} onChange={(e) => setForm({ ...form, validationPlan: e.target.value })} fullWidth />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>标记为宪法级</Typography>
              <Button size="small" variant={form.isConstitution ? 'contained' : 'outlined'} onClick={() => setForm({ ...form, isConstitution: !form.isConstitution })} sx={{ textTransform: 'none' }}>
                {form.isConstitution ? '是' : '否'}
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

function Meta({ label, value }) {
  return (
    <Box>
      <Typography sx={{ fontSize: 12, color: tokens.ink400, mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, color: tokens.ink700 }}>{value || '—'}</Typography>
    </Box>
  )
}
