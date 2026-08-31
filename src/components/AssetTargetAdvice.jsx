import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'

import tokens from '../theme/tokens'
import StatusPill from './StatusPill'
import { useStore } from '../store/useStore'
import { deriveHoldings } from '../utils/dashboard'
import { useCircleArticles, tradeDaysBack, CIRCLE } from '../lib/circleFeed'
import { DIRECTION_TONE } from '../utils/direction'

/**
 * 标的动态走势与建议（信息源 × 投资体系联动）——
 * 三路信息源（月度策略文字 / 周度 PDF / 近三日圈子动态）与持仓、方向状态机结合，
 * 输出每个资产/标的的动态走势预测与建议（建议级，裁决权在人）。
 * 放置于日度简报页：每日动态是最高频的信息源。
 */
export default function AssetTargetAdvice() {
  const targets = useStore((s) => s.targets) || []
  const trades = useStore((s) => s.trades) || []
  const targetStates = useStore((s) => s.targetStates) || []
  const analysis = useStore((s) => s.analysis)
  const { holdings } = deriveHoldings(trades, targets, {})

  // 近三个交易日圈子动态（与日度板块同源）
  const { items } = useCircleArticles(CIRCLE.tags.daily, 15)
  const recent = items.filter((it) => !it.ts || it.ts >= tradeDaysBack(3).getTime())
  const allText = recent.map((i) => i.content).join('\n')

  const total = holdings.reduce((m, h) => m + (h.valueCNY || 0), 0)

  return (
    <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, bgcolor: tokens.surface }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', p: 2, pb: 1.25, borderBottom: `1px solid ${tokens.border}` }}>
        <Box sx={{ bgcolor: tokens.primary, color: '#fff', borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700 }}>联动</Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink900 }}>标的动态走势与建议</Typography>
        <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>月度策略 × 周度分析 × 近三日动态 × 持仓 · 建议级，裁决权在人</Typography>
      </Box>

      <Box sx={{ p: 2, pt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {holdings.map((h) => {
          const ts = targetStates.find((x) => x.targetId === h.targetId || x.code === h.code)
          const ai = analysis?.targets?.[h.code]
          const mentions = h.name && allText ? (allText.split(h.name).length - 1) + (h.code && allText.includes(h.code) ? 1 : 0) : 0
          const weight = total ? ((h.valueCNY / total) * 100).toFixed(1) : '—'
          const dir = ts?.direction || ai?.direction || '持有维持'
          const reason = ts?.directionReason || ai?.directionReason || ai?.thesis || ''
          // 近三日圈子中与该标的相关的最新一句
          let latestMention = ''
          if (mentions) {
            for (let i = 0; i < recent.length && !latestMention; i++) {
              const c = recent[i].content
              const idx = c.indexOf(h.name) >= 0 ? c.indexOf(h.name) : c.indexOf(h.code)
              if (idx >= 0) {
                const sent = c.slice(Math.max(0, idx - 10), idx + 50)
                latestMention = `${recent[i].date.slice(5, 10)}：…${sent.replace(/\n/g, ' ')}…`
              }
            }
          }
          return (
            <Box key={h.targetId || h.code || h.name} sx={{ p: 1.5, borderRadius: tokens.radius.sm, border: `1px solid ${tokens.border}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: tokens.ink900 }}>{h.name || '—'}</Typography>
                {h.code ? <Typography sx={{ fontSize: 11.5, fontFamily: '"Roboto Mono", monospace', color: tokens.ink400 }}>{h.code}</Typography> : null}
                <Chip size="small" label={h.industry || '未分类'} variant="outlined" sx={{ fontSize: 11 }} />
                <StatusPill label={`仓位 ${weight}%`} tone="neutral" size="sm" />
                <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  <StatusPill label={`方向 · ${dir}`} tone={DIRECTION_TONE[dir] || 'hold'} size="sm" />
                  {mentions > 0 && <StatusPill label={`近三日提及 ${mentions}`} tone="ai" size="sm" />}
                </Box>
              </Box>
              <Stack spacing={0.4} sx={{ mt: 0.75 }}>
                {reason && <Typography sx={{ fontSize: 12, color: tokens.ink700, lineHeight: 1.6 }}>依据：{reason.slice(0, 120)}{reason.length > 120 ? '…' : ''}</Typography>}
                {latestMention && <Typography sx={{ fontSize: 12, color: tokens.ink500, lineHeight: 1.6 }}>圈子动态：{latestMention}</Typography>}
                {ts?.discipline?.stopLossHit && <Typography sx={{ fontSize: 12, color: tokens.warn }}>⚠ 止损条件已触发，请人工确认处置。</Typography>}
                {h.isOutOfBoundary && <Typography sx={{ fontSize: 12, color: tokens.warn }}>⚠ 该持仓处于边界外，调整须人工确认。</Typography>}
                {!reason && !latestMention && (
                  <Typography sx={{ fontSize: 12, color: tokens.ink400 }}>暂无方向依据与近三日圈子提及；可在标的研究页生成方向建议。</Typography>
                )}
              </Stack>
            </Box>
          )
        })}
        {!holdings.length && <Typography sx={{ fontSize: 12.5, color: tokens.ink400 }}>暂无持仓数据。</Typography>}
      </Box>
    </Box>
  )
}
