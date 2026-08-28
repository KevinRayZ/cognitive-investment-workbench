import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Collapse from '@mui/material/Collapse'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Refresh from '@mui/icons-material/RefreshOutlined'
import ExpandMore from '@mui/icons-material/ExpandMoreOutlined'
import ExpandLess from '@mui/icons-material/ExpandLessOutlined'
import OpenInNew from '@mui/icons-material/OpenInNewOutlined'

import tokens from '../theme/tokens'
import StatusPill from './StatusPill'
import { useCircleArticles, firstLine, CIRCLE, tradeDaysBack, analyzeTrend } from '../lib/circleFeed'

const ROLE_TONE = { 主理人: 'primary', 嘉宾: 'ai', 管理员: 'neutral', 学员: 'neutral' }

/**
 * 圈子信息流板块（张湧的小密圈 · 环球青藤）——
 * 三页共用：日度简报（近三个交易日）/ 周度分析（本周聚合）/ 月度思路（市场分析直播）。
 * scope: 'all' 全部 | 'week' 本周 | 'month' 本月 | 'trade3' 最近三个交易日
 */
export default function CircleFeedSection({ title, subtitle, tagId, rows = 8, scope = 'all', emptyHint, showTrend = false }) {
  const { items, loading, error, reload } = useCircleArticles(tagId, rows)
  const [expanded, setExpanded] = useState({})

  // 按周期过滤：超出时间范围的属于无效数据，不展示、不分析
  const filtered = items.filter((it) => {
    if (!it.ts) return true
    const d = new Date(it.ts)
    const now = new Date()
    if (scope === 'trade3') {
      return d >= tradeDaysBack(3)
    }
    if (scope === 'week') {
      const day = now.getDay()
      const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - ((day + 6) % 7))
      return d >= mon
    }
    if (scope === 'month') {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }
    return true
  })

  const isToday = (it) => it.ts && new Date(it.ts).toDateString() === new Date().toDateString()

  return (
    <Box sx={{ border: `1px solid ${tokens.border}`, borderRadius: tokens.radius.md, bgcolor: tokens.surface }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', p: 2, pb: 1.25, borderBottom: `1px solid ${tokens.border}` }}>
        <Box sx={{ bgcolor: tokens.primary, color: '#fff', borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700 }}>圈子</Box>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: tokens.ink900 }}>{title}</Typography>
        {subtitle && <Typography sx={{ fontSize: 11.5, color: tokens.ink400 }}>{subtitle}</Typography>}
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <IconButton size="small" onClick={reload} disabled={loading} sx={{ color: tokens.ink500 }}>
            {loading ? <CircularProgress size={14} /> : <Refresh sx={{ fontSize: 17 }} />}
          </IconButton>
          <IconButton size="small" component="a" href={CIRCLE.pageUrl} target="_blank" rel="noreferrer" sx={{ color: tokens.ink500 }} title="打开圈子页面">
            <OpenInNew sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 2, pt: 1.5 }}>
        {/* 市场资产动态趋势快读（基于当前时间范围内的帖子做本地规则分析） */}
        {showTrend && !error && (() => {
          const trend = analyzeTrend(filtered)
          if (!trend) return null
          const Item = ({ label, value }) => !value ? null : (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'baseline' }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: tokens.ink500, flexShrink: 0 }}>{label}</Typography>
              <Typography sx={{ fontSize: 12.5, color: tokens.ink700, lineHeight: 1.6 }}>{value}</Typography>
            </Box>
          )
          return (
            <Box sx={{ mb: 1.5, p: 1.5, borderRadius: tokens.radius.sm, bgcolor: tokens.aiSoft, border: `1px solid ${tokens.ai}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <Box sx={{ bgcolor: tokens.ai, color: '#fff', borderRadius: 1, px: 0.75, fontSize: 11, fontWeight: 700 }}>趋势</Box>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900 }}>市场资产动态趋势快读</Typography>
                <Typography sx={{ fontSize: 11, color: tokens.ink400, ml: 'auto' }}>依据近三个交易日 {trend.sources} 条圈子分析 · 仅供参考，裁决权在人</Typography>
              </Box>
              <Stack spacing={0.5}>
                <Item label="指数" value={trend.index} />
                <Item label="量能" value={trend.volume} />
                <Item label="活跃方向" value={trend.industries.length ? trend.industries.join(' / ') : ''} />
                <Item label="风险提示" value={trend.risk} />
                <Item label="应对参考" value={trend.action} />
              </Stack>
            </Box>
          )
        })()}

        {error === 'MISSING_TOKEN' ? (
          <Alert severity="info" sx={{ fontSize: 12.5 }}>
            尚未配置圈子凭证：请到「设置」页粘贴环球青藤 <b>edu24ol_token</b>（登录圈子后在浏览器开发者工具 Network 面板任意请求的参数中复制）。凭证仅存本机。
          </Alert>
        ) : error ? (
          <Alert severity="warning" sx={{ fontSize: 12.5 }}>
            圈子数据拉取失败：{error}
            <Button size="small" onClick={reload} sx={{ ml: 1 }}>重试</Button>
          </Alert>
        ) : loading && !filtered.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={22} /></Box>
        ) : !filtered.length ? (
          <Typography sx={{ fontSize: 12.5, color: tokens.ink400, py: 1 }}>{emptyHint || '本期暂无帖子。'}</Typography>
        ) : (
          <Stack spacing={1}>
            {filtered.map((it) => {
              const open = !!expanded[it.id]
              return (
                <Box key={it.id} sx={{ p: 1.5, borderRadius: tokens.radius.sm, border: `1px solid ${tokens.border}`, bgcolor: isToday(it) ? tokens.aiSoft : 'transparent' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', cursor: 'pointer' }} onClick={() => setExpanded((s) => ({ ...s, [it.id]: !open }))}>
                    <StatusPill label={it.date} tone={isToday(it) ? 'ai' : 'neutral'} size="sm" />
                    <StatusPill label={it.author} tone={ROLE_TONE[it.role] || 'neutral'} size="sm" />
                    <Typography sx={{ fontSize: 12.5, fontWeight: open ? 400 : 600, color: tokens.ink700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: open ? 'normal' : 'nowrap' }}>
                      {firstLine(it.content)}
                    </Typography>
                    {!!it.audio.length && <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>🔊 {it.audio.length}</Typography>}
                    <Typography sx={{ fontSize: 11, color: tokens.ink400 }}>赞{it.likes}</Typography>
                    {open ? <ExpandLess sx={{ fontSize: 16, color: tokens.ink400 }} /> : <ExpandMore sx={{ fontSize: 16, color: tokens.ink400 }} />}
                  </Box>
                  <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 1, pt: 1, borderTop: `1px dashed ${tokens.border}` }}>
                      <Typography sx={{ fontSize: 13, color: tokens.ink700, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{it.content}</Typography>
                      {!!it.audio.length && (
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          {it.audio.map((f, i) => (
                            <Typography key={i} sx={{ fontSize: 11.5, color: tokens.ink500 }}>📎 {f}</Typography>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Collapse>
                </Box>
              )
            })}
          </Stack>
        )}
      </Box>
    </Box>
  )
}
