import { useState, useRef } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import AutoGraph from '@mui/icons-material/AutoGraph'
import CheckCircle from '@mui/icons-material/CheckCircleOutline'
import UploadFile from '@mui/icons-material/UploadFileOutlined'
import PictureAsPdf from '@mui/icons-material/PictureAsPdfOutlined'

import tokens from '../theme/tokens'
import PageHeader from '../layout/PageHeader'
import StatusPill from '../components/StatusPill'
import CircleFeedSection from '../components/CircleFeedSection'
import { CIRCLE } from '../lib/circleFeed'
import { useStore } from '../store/useStore'
import { deriveHoldings, checkHealth } from '../utils/dashboard'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href

/** 本周一起止（ISO 日期）。 */
function weekRange() {
  const now = new Date()
  const day = now.getDay()
  const ws = new Date(now); ws.setHours(0, 0, 0, 0); ws.setDate(now.getDate() - ((day + 6) % 7))
  const we = new Date(ws); we.setDate(ws.getDate() + 6)
  return { weekStart: ws.toISOString().slice(0, 10), weekEnd: we.toISOString().slice(0, 10) }
}

/**
 * 周度投资分析（应用逻辑完善 §3.4 C4 后半）——
 * 行业趋势状态 + 持仓健康 + L7 纪律审计 + 待办事项。
 * 定时调度（P3）后置，当前提供「生成本周分析」占位入口。
 */
export default function WeeklyReport() {
  const weeklyReports = useStore((s) => s.weeklyReports) || []
  const create = useStore((s) => s.create)
  const targets = useStore((s) => s.targets) || []
  const trades = useStore((s) => s.trades) || []
  const industryWatches = useStore((s) => s.industryWatches) || []
  const fileRef = useRef(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [expanded, setExpanded] = useState({})

  // PDF → 全文提取 → 存为本周分析记录（人工录入，status=人工录入 便于区分自动生成）
  const onPdfFile = async (file) => {
    if (!file) return
    setPdfBusy(true)
    setPdfError('')
    try {
      const buf = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise
      let text = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((it) => it.str).join(' ').replace(/ +/g, ' ') + '\n'
      }
      const { weekStart, weekEnd } = weekRange()
      create('weeklyReports', {
        weekStart,
        weekEnd,
        sourceType: 'pdf',
        fileName: file.name,
        sourceText: text.trim(),
        industryTrends: [],
        holdingHealth: [],
        l7Audit: { violations: [], riskLevel: '低' },
        actionItems: ['本周分析来自人工上传 PDF，请结合行业趋势与持仓健康人工研判'],
        updatedAt: new Date().toISOString(),
      })
    } catch (e) {
      setPdfError(`PDF 解析失败：${e.message || e}（扫描版/图片型 PDF 无法提取文字）`)
    } finally {
      setPdfBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const generate = () => {
    const { holdings } = deriveHoldings(trades, targets, {})
    const health = checkHealth(holdings)
    const violations = health.issues.map((i) => i.text)
    const boundaryCount = trades.filter((t) => t.isOutOfBoundary).length
    const now = new Date()
    const day = now.getDay() // 0=周日
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - ((day + 6) % 7))
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
    const iso = (d) => d.toISOString().slice(0, 10)

    const rec = {
      weekStart: iso(weekStart),
      weekEnd: iso(weekEnd),
      industryTrends: industryWatches.map((iw) => ({ industry: iw.name, trendState: iw.trend?.current || '—', score: iw.trend?.score ?? 0, change: iw.prosperity?.change || '稳定' })),
      holdingHealth: holdings.map((h) => ({ targetId: h.targetId || h.code, health: h.isOutOfBoundary ? '边界外' : h.weight > 20 ? '超限' : '正常', alerts: health.issues.filter((i) => i.text.includes(h.name)).map((i) => i.text) })),
      l7Audit: { violations, riskLevel: boundaryCount ? '偏高' : '低' },
      actionItems: violations.length ? violations : ['本周无纪律违规，保持观察'],
      updatedAt: new Date().toISOString(),
    }
    create('weeklyReports', rec)
  }

  return (
    <Box>
      <PageHeader
        breadcrumb="扩展工作台 / 日报周报月报"
        title="周度投资分析"
        subtitle="行业趋势状态更新 · 持仓健康 · L7 纪律审计 · 待人类处理事项"
        actions={<Button variant="contained" startIcon={<AutoGraph />} onClick={generate} sx={{ bgcolor: tokens.primary }}>生成本周分析（占位）</Button>}
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Card sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md }}>
          <CardContent sx={{ p: 2.25, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <UploadFile sx={{ fontSize: 18, color: tokens.primary }} />
            <Box sx={{ flex: 1, minWidth: 220 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink900 }}>上传每周投资分析（PDF）</Typography>
              <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>自动提取全文作为本周分析依据，与圈子周度聚合并列展示</Typography>
            </Box>
            {pdfError && <Typography sx={{ fontSize: 12, color: tokens.warn }}>{pdfError}</Typography>}
            <Button variant="contained" startIcon={<PictureAsPdf />} disabled={pdfBusy} onClick={() => fileRef.current?.click()} sx={{ bgcolor: tokens.primary }}>
              {pdfBusy ? '解析中…' : '选择 PDF'}
            </Button>
            <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={(e) => onPdfFile(e.target.files?.[0])} />
          </CardContent>
        </Card>

        <CircleFeedSection
          title="本周市场分析聚合"
          subtitle="张湧的小密圈 · 市场动态分析（本周一至今自动过滤）"
          tagId={CIRCLE.tags.daily}
          rows={15}
          scope="week"
          emptyHint="本周暂无圈子分析帖。"
        />

        {weeklyReports.length === 0 ? (
          <Card sx={{ p: 4, borderRadius: tokens.radius.md, border: `1px dashed ${tokens.border}` }}>
            <Typography sx={{ color: tokens.ink400, textAlign: 'center' }}>暂无周度分析。</Typography>
          </Card>
        ) : (
          [...weeklyReports].reverse().map((r) => (
            <Card key={r.id} sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md }}>
              <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <StatusPill label={`${r.weekStart} ~ ${r.weekEnd}`} tone="ai" />
                  <Chip size="small" label={`L7 风险：${r.l7Audit?.riskLevel || '低'}`} color={r.l7Audit?.riskLevel === '低' ? 'success' : 'warning'} variant="outlined" />
                  {r.sourceType === 'pdf' && <Chip size="small" icon={<PictureAsPdf />} label={r.fileName || 'PDF'} variant="outlined" />}
                </Box>

                {r.sourceText && (
                  <Box sx={{ p: 1.25, borderRadius: 1, bgcolor: tokens.aiSoft, border: `1px solid ${tokens.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink500 }}>分析全文（PDF 提取）</Typography>
                      <Button size="small" onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))} sx={{ minWidth: 0, fontSize: 11.5 }}>
                        {expanded[r.id] ? '收起' : '展开全文'}
                      </Button>
                    </Box>
                    <Typography sx={{ fontSize: 12.5, color: tokens.ink700, lineHeight: 1.7, whiteSpace: expanded[r.id] ? 'pre-wrap' : 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.sourceText}
                    </Typography>
                  </Box>
                )}

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>行业趋势状态</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    {(r.industryTrends || []).map((it, i) => (
                      <Chip key={i} size="small" label={`${it.industry} · ${it.trendState} (${it.score})`} variant="outlined" />
                    ))}
                    {!r.industryTrends?.length && <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>无行业观察数据</Typography>}
                  </Stack>
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>L7 纪律审计（{(r.l7Audit?.violations || []).length} 条）</Typography>
                  {(r.l7Audit?.violations || []).length === 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', color: tokens.down, fontSize: 12.5 }}><CheckCircle sx={{ fontSize: 15 }} />无违规</Box>
                  ) : (
                    <Stack spacing={0.4}>
                      {(r.l7Audit?.violations || []).map((v, i) => <Typography key={i} sx={{ fontSize: 12.5, color: tokens.warn }}>· {v}</Typography>)}
                    </Stack>
                  )}
                </Box>

                <Box>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 0.5 }}>待人类处理</Typography>
                  <Stack spacing={0.4}>
                    {(r.actionItems || []).map((a, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', fontSize: 12.5, color: tokens.ink700 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: 1, bgcolor: tokens.warn }} /> {a}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  )
}