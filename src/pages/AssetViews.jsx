import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Slider from '@mui/material/Slider'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import Delete from '@mui/icons-material/DeleteOutline'
import AutoGraph from '@mui/icons-material/AutoGraph'
import WarningAmber from '@mui/icons-material/WarningAmber'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import { useStore } from '../store/useStore'
import { createAssetView } from '../models/schemas'
import { systemRangeForAsset, checkAssetViewRange } from '../utils/direction'

const ASSET_CLASSES = ['权益', '债券', '黄金', '现金', '红利', '成长', '其他']
const DIRECTIONS = ['超配', '标配', '低配']
const DIR_TONE = { 超配: 'up', 标配: 'neutral', 低配: 'warn' }

/**
 * 资产观点管理（应用逻辑完善 §3.2 C2）——
 * 人类将大类资产方向性观点录入，AI 做数据校验/冲突提示/区间约束，方向裁决权在人。
 * 三方对照：人观点 vs 数据证据 vs 总纲 §7.1 区间。
 */
export default function AssetViews() {
  const assetViews = useStore((s) => s.assetViews) || []
  const phase = useStore((s) => s.dashboard?.marketClock?.phase) || '衰退'
  const create = useStore((s) => s.create)
  const update = useStore((s) => s.update)
  const remove = useStore((s) => s.remove)
  const setAssetViewAiCheck = useStore((s) => s.setAssetViewAiCheck)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(createAssetView())

  const openNew = () => { setForm(createAssetView()); setOpen(true) }
  const save = () => {
    if (!form.assetClass) return
    const rec = create('assetViews', { ...form, updatedAt: new Date().toISOString().slice(0, 10) })
    runAiCheck(rec.id, form)
    setOpen(false)
  }
  const runAiCheck = (id, av) => {
    const [low, high] = systemRangeForAsset(av.assetClass, phase)
    const { inRange, conflict } = checkAssetViewRange(av.assetClass, av.strength, phase)
    setAssetViewAiCheck(id, {
      systemRange: { min: low, max: high },
      dataEvidence: `当前周期阶段「${phase}」：总纲 §7.1 对应区间 [${low}%–${high}%]；观点强度 ${av.strength}/100。`,
      conflict,
    })
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台"
        title="资产观点（大类方向）"
        subtitle="人观点 vs 数据证据 vs 总纲 §7.1 区间 · 三方对照；方向裁决权在人，AI 仅校验与提示"
        actions={<Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ bgcolor: tokens.primary }}>新增观点</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.aiSoft, border: `1px solid ${tokens.border}` }}>
          <Typography sx={{ fontSize: 12.5, color: tokens.ink700, lineHeight: 1.6 }}>
            当前周期阶段：<b>{phase}</b>。观点与总纲 §7.1 区间冲突时仅提示、不阻止录入；「AI 校验」会刷新数据面证据与区间对照，最终方向裁决由你完成。
          </Typography>
        </Box>

        {assetViews.length === 0 ? (
          <Card sx={{ p: 4, borderRadius: tokens.radius.md, border: `1px dashed ${tokens.border}` }}>
            <Typography sx={{ color: tokens.ink400, textAlign: 'center' }}>暂无资产观点，点击「新增观点」录入你对大类资产的方向性思路。</Typography>
          </Card>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
            {assetViews.map((av) => {
              const [low, high] = systemRangeForAsset(av.assetClass, phase)
              const conflicts = av.aiCheck?.conflict || []
              return (
                <Card key={av.id} sx={{ border: `1px solid ${conflicts.length ? tokens.warn : tokens.border}`, borderRadius: tokens.radius.md }}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, p: 2.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <StatusPill label={av.assetClass} tone="ai" size="sm" />
                      <StatusPill label={av.direction} tone={DIR_TONE[av.direction] || 'neutral'} size="sm" />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900 }}>强度 {av.strength}/100</Typography>
                      <Chip size="small" label={av.status} variant="outlined" sx={{ ml: 'auto' }} />
                      <IconButton size="small" onClick={() => remove('assetViews', av.id)}><Delete sx={{ fontSize: 16, color: tokens.ink400 }} /></IconButton>
                    </Box>

                    {av.rationale ? <Typography sx={{ fontSize: 13, color: tokens.ink700, lineHeight: 1.6 }}>{av.rationale}</Typography> : null}

                    <Box sx={{ p: 1.25, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: tokens.ink500 }}>AI · 数据证据 & 总纲区间</Typography>
                      <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.4 }}>{av.aiCheck?.dataEvidence || '尚未校验'}</Typography>
                      <Typography sx={{ fontSize: 12, color: tokens.ink700, mt: 0.4 }}>区间：[{av.aiCheck?.systemRange?.min ?? low}%–{av.aiCheck?.systemRange?.max ?? high}%] · 来源：{av.source === 'human' ? '人工录入' : 'AI 草稿'}</Typography>
                    </Box>

                    {conflicts.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, p: 1.25, borderRadius: tokens.radius.sm, bgcolor: tokens.warnSoft, border: `1px solid ${tokens.warn}` }}>
                        <WarningAmber sx={{ fontSize: 16, color: tokens.warn, flexShrink: 0, mt: 0.2 }} />
                        <Stack spacing={0.3}>
                          {conflicts.map((c, i) => <Typography key={i} sx={{ fontSize: 12, color: '#9A6700' }}>{c}</Typography>)}
                        </Stack>
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" startIcon={<AutoGraph />} onClick={() => runAiCheck(av.id, av)} sx={{ color: tokens.ai }}>AI 校验</Button>
                    </Box>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>新增资产观点</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select fullWidth label="大类资产" value={form.assetClass} onChange={(e) => setForm({ ...form, assetClass: e.target.value })}>
                {ASSET_CLASSES.map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
              </TextField>
              <TextField select fullWidth label="方向" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                {DIRECTIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            </Box>
            <Box>
              <Typography sx={{ fontSize: 12, color: tokens.ink500, mb: 0.5 }}>观点强度：{form.strength}/100</Typography>
              <Slider value={Number(form.strength)} min={0} max={100} onChange={(_, v) => setForm({ ...form, strength: v })} size="small" sx={{ color: tokens.primary }} />
            </Box>
            <TextField label="观点依据（为何超配/低配）" value={form.rationale} onChange={(e) => setForm({ ...form, rationale: e.target.value })} multiline minRows={3} fullWidth />
            <TextField select label="状态" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['生效', '待确认', '已失效'].map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} sx={{ color: tokens.ink500 }}>取消</Button>
          <Button variant="contained" onClick={save} sx={{ bgcolor: tokens.primary }}>保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}