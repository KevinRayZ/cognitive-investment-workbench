import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Slider from '@mui/material/Slider'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import Edit from '@mui/icons-material/EditOutlined'
import Delete from '@mui/icons-material/DeleteOutline'
import Lock from '@mui/icons-material/LockOutlined'
import CheckCircle from '@mui/icons-material/CheckCircle'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'
import GateStepper from '../components/GateStepper'
import { validateGate, canSubmitMemo, GATE_LABELS } from '../utils/validators'
import { createMemo } from '../models/schemas'

const DIRECTIONS = ['拟买', '拟卖', '做多', '做空']

export default function Memo() {
  const memos = useStore((s) => s.memos)
  const principles = useStore((s) => s.principles)
  const errors = useStore((s) => s.getErrors())
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)

  const [selectedId, setSelectedId] = useState(memos[0]?.id || '')
  const [draft, setDraft] = useState(memos[0] || null)

  const selected = memos.find((m) => m.id === selectedId) || draft

  const selectMemo = (m) => { setSelectedId(m.id); setDraft({ ...m }) }
  const newMemo = () => {
    const rec = create('memos', createMemo())
    setSelectedId(rec.id)
    setDraft({ ...rec })
  }
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const toggleArr = (key, id) =>
    setDraft((d) => {
      const arr = d[key] || []
      return { ...d, [key]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] }
    })

  const gate = selected ? validateGate(selected) : [false, false, false, false, false]
  const passed = selected ? canSubmitMemo(selected) : false

  const saveDraft = () => { if (selected) update('memos', selected.id, draft) }
  const submitGate = () => {
    if (!selected || !passed) return
    const history = [...(draft.decisionHistory || []), { at: new Date().toISOString().slice(0, 10), action: '决策通过', note: '5 步闸门全通过，提交闸门' }]
    update('memos', selected.id, { ...draft, status: '已决策', gateChecks: gate, decisionHistory: history })
  }
  const handleDelete = (m) => { if (window.confirm(`确定删除备忘录 ${m.id}？`)) { remove('memos', m.id); setSelectedId(''); setDraft(null) } }

  return (
    <Box>
      <PageHeader
        breadcrumb="决策前闸门"
        title="投资备忘录"
        subtitle="每笔决策前的七要素 + 红队挑战 + 引用编号；5 步闸门未通过则阻塞提交"
        status={<StatusPill label={selected ? (passed ? '闸门通过' : '闸门阻塞') : '无'} tone={selected ? (passed ? 'down' : 'warn') : 'neutral'} />}
        actions={<Button variant="contained" startIcon={<Add />} onClick={newMemo} sx={{ bgcolor: tokens.primary }}>新建备忘录</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* 左：备忘录列表 */}
        <Stack spacing={1} sx={{ width: 280, flexShrink: 0 }}>
          {memos.map((m) => {
            const active = m.id === selectedId
            const ok = canSubmitMemo(m)
            return (
              <Box key={m.id} onClick={() => selectMemo(m)} sx={{ p: 1.5, borderRadius: tokens.radius.md, border: `1.5px solid ${active ? tokens.primary : tokens.border}`, bgcolor: active ? tokens.primarySoft : tokens.surface, cursor: 'pointer' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <IdBadge id={m.id} size="sm" />
                  {ok ? <CheckCircle sx={{ fontSize: 15, color: tokens.down }} /> : <Lock sx={{ fontSize: 15, color: tokens.warn }} />}
                </Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: tokens.ink900 }}>{m.targetName}</Typography>
                <Typography sx={{ fontSize: 12, color: tokens.ink500 }}>{m.direction} · 信心 {m.confidence}%</Typography>
              </Box>
            )
          })}
        </Stack>

        {/* 右：编辑器 */}
        {selected ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* 闸门 */}
            <Box sx={{ p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>决策前闸门（5 步）</Typography>
              <GateStepper steps={gate} labels={GATE_LABELS} />
            </Box>

            <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* 左栏：3 卡 */}
              <Box sx={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Card title="投资逻辑" value={selected.logic} onChange={(v) => set({ logic: v })} multiline />
                <Card title="红队挑战（必填·反对意见 / 反向证据）" value={selected.redTeamChallenge} onChange={(v) => set({ redTeamChallenge: v })} multiline warn />
                <Card title="退出条件" value={selected.exitConditions} onChange={(v) => set({ exitConditions: v })} multiline />
                <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900 }}>本笔信心</Typography>
                    <Typography sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700, color: selected.confidence >= 60 ? tokens.down : tokens.warn }}>{selected.confidence}%</Typography>
                  </Box>
                  <Slider value={selected.confidence} min={0} max={100} onChange={(e, v) => set({ confidence: v })} sx={{ color: tokens.primary }} />
                  <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>最后一步闸门要求信心 ≥ 60% 方可通过。</Typography>
                </Box>
              </Box>

              {/* 右栏：事实卡 */}
              <Box sx={{ flex: 1, minWidth: 300, p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mb: 1.5 }}>决策事实卡</Typography>
                <Stack spacing={1.5}>
                  <TextField label="关联标的" value={selected.targetName} onChange={(e) => set({ targetName: e.target.value })} fullWidth size="small" />
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField select label="方向" value={selected.direction} onChange={(e) => set({ direction: e.target.value })} size="small" sx={{ width: 120 }}>
                      {DIRECTIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                    </TextField>
                    <TextField label="预期收益" value={selected.expectedReturn} onChange={(e) => set({ expectedReturn: e.target.value })} fullWidth size="small" />
                  </Box>
                  <TextField label="时间框架" value={selected.timeFrame} onChange={(e) => set({ timeFrame: e.target.value })} fullWidth size="small" />
                  <TextField label="催化剂" value={selected.catalyst} onChange={(e) => set({ catalyst: e.target.value })} fullWidth size="small" />
                  <TextField label="风险" value={selected.risk} onChange={(e) => set({ risk: e.target.value })} fullWidth size="small" />
                </Stack>

                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900, mt: 2, mb: 0.75 }}>引用原则（IS）</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75}>
                  {principles.map((p) => {
                    const on = (selected.isIds || []).includes(p.id)
                    return (
                      <Box key={p.id} onClick={() => toggleArr('isIds', p.id)} sx={{ cursor: 'pointer', px: 1, py: 0.4, borderRadius: 1.5, fontSize: 12, border: `1px solid ${on ? tokens.primary : tokens.border}`, bgcolor: on ? tokens.primarySoft : tokens.surface, color: on ? tokens.primary : tokens.ink500, fontFamily: '"Roboto Mono", monospace' }}>
                        {p.id}
                      </Box>
                    )
                  })}
                </Stack>

                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900, mt: 1.5, mb: 0.75 }}>引用错误（ERR）</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75}>
                  {errors.map((e) => {
                    const on = (selected.errIds || []).includes(e.errId)
                    return (
                      <Box key={e.errId} onClick={() => toggleArr('errIds', e.errId)} sx={{ cursor: 'pointer', px: 1, py: 0.4, borderRadius: 1.5, fontSize: 12, border: `1px solid ${on ? tokens.warn : tokens.border}`, bgcolor: on ? tokens.warnSoft : tokens.surface, color: on ? '#9A6700' : tokens.ink500, fontFamily: '"Roboto Mono", monospace' }}>
                        {e.errId}
                      </Box>
                    )
                  })}
                </Stack>
              </Box>
            </Box>

            {/* 决策历史 */}
            <Box sx={{ p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}` }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900, mb: 1 }}>决策历史</Typography>
              <Stack spacing={0.75}>
                {(selected.decisionHistory || []).map((h, i) => (
                  <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', fontSize: 13 }}>
                    <Box sx={{ fontFamily: '"Roboto Mono", monospace', fontSize: 12, color: tokens.ink400, width: 96 }}>{h.at}</Box>
                    <StatusPill label={h.action} tone="primary" size="sm" />
                    <Typography sx={{ color: tokens.ink700 }}>{h.note}</Typography>
                  </Box>
                ))}
                {(selected.decisionHistory || []).length === 0 && <Typography sx={{ fontSize: 13, color: tokens.ink400 }}>暂无决策记录。</Typography>}
              </Stack>
            </Box>

            {/* 操作 */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <IconButton onClick={() => handleDelete(selected)}><Delete sx={{ fontSize: 18, color: tokens.up }} /></IconButton>
              <Button variant="outlined" onClick={saveDraft} sx={{ color: tokens.ink500, borderColor: tokens.border }}>保存草稿</Button>
              <Button variant="contained" disabled={!passed} startIcon={passed ? <CheckCircle /> : <Lock />} onClick={submitGate} sx={{ bgcolor: passed ? tokens.down : tokens.ink400 }}>
                {passed ? '提交闸门' : '闸门未通过 · 阻塞提交'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ flex: 1, p: 4, textAlign: 'center', color: tokens.ink400 }}>点击「新建备忘录」开始决策记录。</Box>
        )}
      </Box>
    </Box>
  )
}

function Card({ title, value, onChange, multiline, warn }) {
  return (
    <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${warn ? tokens.warn : tokens.border}`, borderLeft: `3px solid ${warn ? tokens.warn : tokens.primary}` }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900, mb: 0.75 }}>{title}</Typography>
      <TextField
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        multiline
        minRows={multiline ? 3 : 1}
        fullWidth
        size="small"
        placeholder={warn ? '必填：记录反对意见与反向证据' : ''}
        sx={{ '& .MuiInputBase-root': { bgcolor: tokens.bgPage } }}
      />
    </Box>
  )
}
