import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import Trash from '@mui/icons-material/DeleteOutline'
import ArrowForward from '@mui/icons-material/ArrowForward'
import CheckCircle from '@mui/icons-material/CheckCircleOutline'
import WarningAmber from '@mui/icons-material/WarningAmber'
import OpenInNew from '@mui/icons-material/OpenInNew'
import Refresh from '@mui/icons-material/Refresh'
import AutoGraph from '@mui/icons-material/AutoGraph'

import tokens from '../theme/tokens'
import { useStore } from '../store/useStore'
import PageHeader from '../layout/PageHeader'
import KpiCard from '../components/KpiCard'
import StatusPill from '../components/StatusPill'
import IdBadge from '../components/IdBadge'
import MerrillClock from '../components/dashboard/MerrillClock'
import AssetAttractiveness from '../components/dashboard/AssetAttractiveness'
import { deriveHoldings, checkHealth, HARD_RULES, CLOCK_PHASES } from '../utils/dashboard'
import { fmtCurrency, fmtSignedCurrency, fmtPct } from '../utils/formatters'
import { runRealtimeAnalysis } from '../lib/analysis'

const CAPABILITY_CIRCLE = ['科技', '消费', '医药', '资源', '红利', '黄金', '债券']

function todayYm() {
  return new Date().toISOString().slice(0, 7)
}

function fmtAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60 * 1000) return '刚刚'
  if (diff < 3600 * 1000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 24 * 3600 * 1000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function isBlocked(compliance) {
  return typeof compliance === 'string' && /阻断|否决|ST|退市|立案|处罚/.test(compliance)
}

function SectionTitle({ children, desc, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: tokens.ink900 }}>{children}</Typography>
        {desc && <Typography sx={{ fontSize: 12, color: tokens.ink400, mt: 0.25 }}>{desc}</Typography>}
      </Box>
      {action}
    </Box>
  )
}

function Card({ children, sx }) {
  return (
    <Box sx={{ p: 2.5, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, boxShadow: '0 1px 3px rgba(15,23,41,.06)', ...sx }}>
      {children}
    </Box>
  )
}

// AI 大类资产研判条
function AssetAiBars({ views, notes }) {
  const order = [
    ['equity', 'A股'],
    ['hkequity', '港股'],
    ['usequity', '美股'],
    ['bond', '债券'],
    ['gold', '黄金'],
    ['commodity', '商品'],
    ['cash', '现金'],
  ]
  const tone = (v) => (v >= 66 ? tokens.up : v >= 40 ? tokens.primary : tokens.down)
  return (
    <Box>
      <Stack spacing={1}>
        {order.map(([k, label]) => {
          const v = views?.[k]
          if (v == null) return null
          return (
            <Box key={k} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 12.5, color: tokens.ink600, width: 44, flexShrink: 0 }}>{label}</Typography>
              <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}`, overflow: 'hidden' }}>
                <Box sx={{ width: `${v}%`, height: '100%', bgcolor: tone(v) }} />
              </Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: tone(v), width: 28, textAlign: 'right', fontFamily: '"Roboto Mono", monospace' }}>{v}</Typography>
            </Box>
          )
        })}
      </Stack>
      {notes && <Typography sx={{ fontSize: 12.5, color: tokens.ink700, mt: 1.5 }}>{notes}</Typography>}
    </Box>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const dashboard = useStore((s) => s.dashboard)
  const updateDashboard = useStore((s) => s.updateDashboard)
  const analysis = useStore((s) => s.analysis)
  const principles = useStore((s) => s.principles)
  const methods = useStore((s) => s.methods)
  const targets = useStore((s) => s.targets)
  const trades = useStore((s) => s.trades)
  const memos = useStore((s) => s.memos)
  const clearSamples = useStore((s) => s.clearSamples)

  const [analyzing, setAnalyzing] = useState(false)
  const bootRef = useRef(false)

  const syncPush = async () => {
    try {
      const { getGithubToken } = await import('../lib/credentials')
      const { pushEntity } = await import('../lib/sync')
      if (getGithubToken()) await pushEntity('analysis', useStore.getState().analysis)
    } catch (e) {
      console.warn('[analysis] push failed', e)
    }
  }

  // 打开网页即触发实时分析（仅首屏一次；缓存未过期自动跳过）
  useEffect(() => {
    if (bootRef.current) return
    bootRef.current = true
    ;(async () => {
      try {
        setAnalyzing(true)
        await runRealtimeAnalysis({ force: false })
        await syncPush()
      } catch (e) {
        console.warn('[analysis] boot run failed', e)
      } finally {
        setAnalyzing(false)
      }
    })()
  }, [])

  const handleRefresh = async () => {
    try {
      setAnalyzing(true)
      await runRealtimeAnalysis({ force: true })
      await syncPush()
    } catch (e) {
      console.warn('[analysis] refresh failed', e)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleRefreshOne = async (code) => {
    try {
      setAnalyzing(true)
      await runRealtimeAnalysis({ force: true, onlyCode: code })
      await syncPush()
    } catch (e) {
      console.warn('[analysis] refresh one failed', e)
    } finally {
      setAnalyzing(false)
    }
  }

  const { marketClock, assets, monthlyStrategy } = dashboard || {}
  const clock = marketClock || { phase: '衰退', note: '', updatedAt: '' }
  const assetList = assets || []
  const strategy = monthlyStrategy || { ym: todayYm(), content: '' }
  const macro = analysis?.macro

  const handleClear = () => {
    if (window.confirm('确定清空全部示例数据？仅删除 isSample 标记的记录，你的新增内容将保留。')) clearSamples()
  }

  // 持仓衍生 + 健康检查
  const { holdings, totalCNY } = deriveHoldings(trades, targets)
  const health = checkHealth(holdings)
  const heldTargetIds = new Set(trades.filter((t) => t.status !== '已平仓' && t.targetId).map((t) => t.targetId))
  const watchlist = targets.filter((t) => !heldTargetIds.has(t.id))

  const onClockPhase = (p) =>
    updateDashboard({ marketClock: { ...clock, phase: p, updatedAt: new Date().toISOString().slice(0, 10) } })
  const onClockNote = (note) => updateDashboard({ marketClock: { ...clock, note } })
  const onAssetChange = (id, patch) =>
    updateDashboard({ assets: assetList.map((a) => (a.id === id ? { ...a, ...patch } : a)) })
  const onStrategy = (content) => updateDashboard({ monthlyStrategy: { ...strategy, content } })

  const beliefs = principles.filter((p) => p.isConstitution).slice(0, 5)
  const ym = strategy.ym || todayYm()

  const analysisTargets = analysis?.targets || {}

  return (
    <Box>
      <PageHeader
        breadcrumb="全局看板"
        title="工作台首页"
        subtitle="市场定位 · 认知体系 · 策略 · 持仓 · 观察池 · 备忘录 的一体化视图"
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={analyzing ? <CircularProgress size={14} /> : <Refresh />}
              onClick={handleRefresh}
              disabled={analyzing}
              sx={{ color: tokens.primary, borderColor: tokens.primary }}
            >
              {analyzing ? '分析中' : '刷新实时分析'}
            </Button>
            <Button variant="outlined" color="inherit" startIcon={<Trash />} onClick={handleClear} sx={{ color: tokens.ink500, borderColor: tokens.border }}>
              清空示例
            </Button>
          </Box>
        }
      />

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* 待处理提醒 */}
        {(() => {
          const todo = useStore.getState().getTodolist()
          return todo.length > 0 ? (
            <Stack divider={<Divider />} sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
              {todo.map((t) => (
                <Box key={t.id} onClick={() => navigate(t.route)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, cursor: 'pointer', '&:hover': { bgcolor: tokens.bgPage } }}>
                  <StatusPill label={t.type} tone={t.tone} />
                  <Typography sx={{ flex: 1, fontSize: 13.5, color: tokens.ink700 }}>{t.label}</Typography>
                  <ArrowForward sx={{ fontSize: 16, color: tokens.ink400 }} />
                </Box>
              ))}
            </Stack>
          ) : null
        })()}

        {/* KPI 条 */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <KpiCard label="当前持仓" value={holdings.length} />
          <KpiCard label="观察池" value={watchlist.length} accent={tokens.ai} />
          <KpiCard label="分析标的" value={Object.keys(analysisTargets).length} accent={tokens.primary} />
          <KpiCard label="本月交易" value={trades.filter((t) => (t.date || '').startsWith(ym)).length} />
        </Box>

        {/* ===== 1. 市场情况展示区 ===== */}
        <Box>
          <SectionTitle
            desc="宏观经济周期定位 + 大类资产吸引力与建议仓位（含垂类 Agent 实时分析）"
            action={macro?.updatedAt ? <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>AI 研判更新于 {fmtAgo(macro.updatedAt)}</Typography> : null}
          >
            市场情况展示区
          </SectionTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card>
              <SectionTitle desc="点击时钟象限定位当前中国经济所处阶段（梅林时钟）；下方为 AI 实时研判">宏观经济周期定位</SectionTitle>
              <MerrillClock phase={clock.phase} note={clock.note} onPhase={onClockPhase} onNote={onClockNote} />
              {macro?.phase && (
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: tokens.radius.md, bgcolor: tokens.bgPage, border: `1px dashed ${tokens.border}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <AutoGraph sx={{ fontSize: 16, color: tokens.primary }} />
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900 }}>
                      AI 实时研判：{macro.phase}
                      <Typography component="span" sx={{ fontSize: 11, color: tokens.ink400, ml: 1 }}>（置信 {macro.confidence || '—'}）</Typography>
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: 12.5, color: tokens.ink700, lineHeight: 1.6 }}>{macro.rationale}</Typography>
                </Box>
              )}
            </Card>
            <Card>
              <SectionTitle desc="客观吸引力评分（可调）+ 你的主观判断 → 自动给出建议仓位区间">大类资产吸引力仪表盘</SectionTitle>
              <AssetAttractiveness assets={assetList} onChange={onAssetChange} />
            </Card>
            <Card>
              <SectionTitle desc="垂类 Agent 综合研判（约 6 小时刷新；宏观/大类约 30 天刷新）。来源：实时行情 + DeepSeek">AI 大类资产实时研判</SectionTitle>
              {macro?.assetViews ? (
                <AssetAiBars views={macro.assetViews} notes={macro.assetNotes} />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: tokens.ink400 }}>
                  <CircularProgress size={16} /> <Typography sx={{ fontSize: 13 }}>分析中…（需在「设置」填写 DeepSeek API Key）</Typography>
                </Box>
              )}
            </Card>
          </Box>
        </Box>

        {/* ===== 2. 个人投资认知体系概览 ===== */}
        <Box>
          <SectionTitle desc="体系总纲核心：信念 / 策略 / 能力圈 / 硬约束">个人投资认知体系概览</SectionTitle>
          <Card>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 1 }}>5 条永久底层信念</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {beliefs.map((b) => (
                    <Box key={b.id} sx={{ px: 1.25, py: 0.6, borderRadius: 1.5, fontSize: 12.5, bgcolor: tokens.primarySoft, color: tokens.primary, fontWeight: 600 }}>
                      {b.title}
                    </Box>
                  ))}
                </Stack>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 1 }}>六大融合策略（分场景 · 带边界红线）</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1 }}>
                  {methods.map((m) => (
                    <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, borderRadius: tokens.radius.sm, bgcolor: tokens.bgPage }}>
                      <IdBadge id={m.id} size="sm" />
                      <Typography sx={{ fontSize: 12.5, color: tokens.ink700, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</Typography>
                      <StatusPill label={m.status} tone={m.status === '启用' ? 'down' : 'neutral'} size="sm" />
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box sx={{ display: { xs: 'column', md: 'row' }, gap: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 1 }}>能力圈</Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75}>
                    {CAPABILITY_CIRCLE.map((c) => (
                      <Box key={c} sx={{ px: 1.1, py: 0.5, borderRadius: 1.5, fontSize: 12, bgcolor: tokens.aiSoft, color: tokens.ai, fontWeight: 600 }}>{c}</Box>
                    ))}
                  </Stack>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink500, mb: 1 }}>个人硬约束</Typography>
                  <Stack direction="row" spacing={0.75} flexWrap="wrap" gap={0.75}>
                    {HARD_RULES.map((r) => (
                      <Box key={r} sx={{ px: 1.1, py: 0.5, borderRadius: 1.5, fontSize: 12, bgcolor: tokens.warnSoft, color: '#9A6700', fontWeight: 600 }}>{r}</Box>
                    ))}
                  </Stack>
                </Box>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* ===== 3. 本月投资策略 ===== */}
        <Box>
          <SectionTitle desc="本月的配置主线与节奏（按月保存，云同步）">本月投资策略 · {ym}</SectionTitle>
          <Card>
            <TextField
              value={strategy.content || ''}
              onChange={(e) => onStrategy(e.target.value)}
              multiline
              minRows={4}
              fullWidth
              placeholder="写下本月的核心策略：仓位基调、重点方向、回避项、关键观察点…（例如：衰退筑底阶段，债券与黄金为底仓，权益待 PMI 企稳后分批提升；规避高估值题材。）"
              sx={{ '& .MuiInputBase-root': { bgcolor: tokens.bgPage, fontSize: 13.5 } }}
            />
          </Card>
        </Box>

        {/* ===== 4. 持仓监控 + 健康检查 ===== */}
        <Box>
          <SectionTitle desc="当前持仓市值 / 权重（跨币种近似折算）+ 对照《总纲》硬约束 + 垂类 Agent 合规研判">持仓监控面板 · 健康检查</SectionTitle>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: tokens.bgPage }}>
                    {['标的', '方向', '权重', '市值(≈折算)', '浮动盈亏', 'AI 合规', '状态'].map((h) => (
                      <TableCell key={h} sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink700, whiteSpace: 'nowrap' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {holdings.map((h) => {
                    const a = h.code ? analysisTargets[h.code] : null
                    const blocked = a ? isBlocked(a.compliance) : false
                    return (
                      <TableRow key={h.id} sx={{ '& td': { fontSize: 13, color: tokens.ink700, py: 1.1, whiteSpace: 'nowrap' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <span style={{ fontWeight: 600 }}>{h.name}</span>
                            {h.code && <span style={{ fontSize: 11, color: tokens.ink400, fontFamily: '"Roboto Mono", monospace' }}>{h.code}</span>}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography component="span" sx={{ color: h.direction === '做多' ? tokens.up : tokens.down, fontWeight: 600 }}>{h.direction}</Typography>
                        </TableCell>
                        <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', fontWeight: 700 }}>{h.weight.toFixed(1)}%</TableCell>
                        <TableCell sx={{ fontFamily: '"Roboto Mono", monospace' }}>{fmtCurrency(h.valueCNY, 'CNY')}</TableCell>
                        <TableCell sx={{ fontFamily: '"Roboto Mono", monospace', color: h.pnlCNY >= 0 ? tokens.up : tokens.down, fontWeight: 600 }}>{fmtSignedCurrency(h.pnlCNY, 'CNY')}</TableCell>
                        <TableCell>
                          {a ? (
                            <StatusPill label={blocked ? '阻断' : '通过'} tone={blocked ? 'warn' : 'down'} size="sm" />
                          ) : (
                            <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {h.isOutOfBoundary ? <StatusPill label="边界外" tone="warn" size="sm" /> : <StatusPill label="正常" tone="down" size="sm" />}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {holdings.length === 0 && (
                    <TableRow><TableCell colSpan={7} sx={{ textAlign: 'center', color: tokens.ink400, py: 3 }}>暂无持仓（未平仓交易为空）。</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              {holdings.length > 0 && (
                <Typography sx={{ fontSize: 11.5, color: tokens.ink400, mt: 1 }}>
                  组合折算市值合计 ≈ {fmtCurrency(totalCNY, 'CNY')}（USD≈7.23 / HKD≈0.92 近似折算，仅用于权重估算）。AI 合规列来自垂类 Agent 实时分析。
                </Typography>
              )}
            </Card>

            {/* 健康检查 */}
            <Card sx={{ borderColor: health.issues.length ? (health.issues.some((i) => i.level === 'breach') ? tokens.warn : tokens.border) : tokens.down }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                {health.issues.length === 0 ? (
                  <CheckCircle sx={{ fontSize: 18, color: tokens.down }} />
                ) : (
                  <WarningAmber sx={{ fontSize: 18, color: tokens.warn }} />
                )}
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: tokens.ink900 }}>
                  健康检查{health.issues.length === 0 ? '：通过' : `：发现 ${health.issues.length} 项`}
                </Typography>
              </Box>
              {health.issues.length === 0 ? (
                <Typography sx={{ fontSize: 13, color: tokens.down }}>
                  单票峰值 {health.singleMax.toFixed(1)}% · 行业峰值 {health.industryMax.toFixed(1)}% · 边界外 {health.boundaryCount} 笔，均在硬约束内。
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {health.issues.map((i, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 0.75, alignItems: 'center', fontSize: 13, color: i.level === 'breach' ? tokens.warn : tokens.ink700 }}>
                      <Box sx={{ width: 7, height: 7, borderRadius: 2, bgcolor: i.level === 'breach' ? tokens.warn : tokens.ink400, flexShrink: 0 }} />
                      {i.text}
                    </Box>
                  ))}
                </Stack>
              )}
            </Card>
          </Box>
        </Box>

        {/* ===== 5. 观察池 ===== */}
        <Box>
          <SectionTitle desc="已列入研究、尚未建仓的标的（AI 吸引力 / 逻辑 / 合规来自垂类 Agent 实时分析）" action={<Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/research')} sx={{ color: tokens.primary }}>研究库</Button>}>
            观察池（{watchlist.length}）
          </SectionTitle>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
            {watchlist.map((t) => {
              const a = analysisTargets[t.code]
              const blocked = a ? isBlocked(a.compliance) : false
              const attract = a?.attractiveness
              return (
                <Box key={t.id} onClick={() => navigate(`/research/${t.code}`)} sx={{ p: 2, borderRadius: tokens.radius.md, bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, cursor: 'pointer', '&:hover': { borderColor: tokens.primary } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 700, color: tokens.ink900, fontSize: 14 }}>{t.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {a?.quote?.price != null && (
                        <Typography sx={{ fontSize: 11.5, color: tokens.ink400, fontFamily: '"Roboto Mono", monospace' }}>
                          {a.quote.price}
                          {a.quote.changePct != null && (
                            <span style={{ color: a.quote.changePct >= 0 ? tokens.up : tokens.down }}> {a.quote.changePct >= 0 ? '+' : ''}{a.quote.changePct}%</span>
                          )}
                        </Typography>
                      )}
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleRefreshOne(t.code) }}
                        disabled={analyzing}
                        sx={{ color: tokens.ink400 }}
                      >
                        <Refresh sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: 11.5, color: tokens.ink400, fontFamily: '"Roboto Mono", monospace', mb: 0.75 }}>{t.code} · {t.stage}</Typography>

                  {a ? (
                    <Box onClick={(e) => e.stopPropagation()}>
                      {/* 吸引力条 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                        <Typography sx={{ fontSize: 11.5, color: tokens.ink500, whiteSpace: 'nowrap' }}>AI 吸引力</Typography>
                        <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}`, overflow: 'hidden' }}>
                          <Box sx={{ width: `${attract ?? 0}%`, height: '100%', bgcolor: attract >= 66 ? tokens.up : attract >= 40 ? tokens.primary : tokens.down }} />
                        </Box>
                        <Typography sx={{ fontSize: 11.5, color: tokens.ink500, fontFamily: '"Roboto Mono", monospace' }}>{attract ?? '—'}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: 12, color: tokens.ink700, mb: 0.5, lineHeight: 1.5 }}>{a.thesis}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <StatusPill label={blocked ? '合规阻断' : '合规通过'} tone={blocked ? 'warn' : 'down'} size="sm" />
                        {a.verdict && <StatusPill label={a.verdict} tone="neutral" size="sm" />}
                        <Typography sx={{ fontSize: 10.5, color: tokens.ink400 }}>{fmtAgo(a.updatedAt)}</Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: tokens.ink400, mt: 1 }}>
                      {analyzing ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: 14 }} />}
                      <Typography sx={{ fontSize: 11.5 }}>分析中…（需 DeepSeek Key）</Typography>
                    </Box>
                  )}
                </Box>
              )
            })}
            {watchlist.length === 0 && <Typography sx={{ color: tokens.ink400, gridColumn: '1 / -1', p: 2 }}>观察池为空——所有研究标的均已建仓，或尚未添加研究标的。</Typography>}
          </Box>
        </Box>

        {/* ===== 6. 备忘录 ===== */}
        <Box>
          <SectionTitle desc="最近决策备忘录" action={<Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/memo')} sx={{ color: tokens.primary }}>查看全部</Button>}>
            备忘录
          </SectionTitle>
          <Stack divider={<Divider />} sx={{ bgcolor: tokens.surface, border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, overflow: 'hidden' }}>
            {useStore.getState().getRecentMemos().map((m) => (
              <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
                <IdBadge id={m.id} />
                <Typography sx={{ flex: 1, fontSize: 13.5, color: tokens.ink700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.targetName} · {m.direction}
                </Typography>
                <StatusPill label={m.status} tone={m.status === '已决策' || m.status === '已执行' ? 'down' : 'neutral'} />
              </Box>
            ))}
            {useStore.getState().getRecentMemos().length === 0 && <Typography sx={{ color: tokens.ink400, p: 2 }}>暂无备忘录。</Typography>}
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
