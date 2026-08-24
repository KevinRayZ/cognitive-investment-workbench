import { useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import tokens, { TONE_COLORS } from '../../theme/tokens'
import { CLOCK_PHASES } from '../../utils/dashboard'

const CX = 170
const CY = 170
const R = 140

// 数学角 → SVG 坐标（y 向上为正）
function polar(angleDeg, radius = R) {
  const a = (angleDeg * Math.PI) / 180
  return { x: CX + radius * Math.cos(a), y: CY - radius * Math.sin(a) }
}

// 90° 扇形（从 start 到 start+90，CCW）路径
function sectorPath(startAngle) {
  const p1 = polar(startAngle)
  const p2 = polar(startAngle + 90)
  return `M ${CX} ${CY} L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${R} ${R} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} Z`
}

// 四象限起点角（与 CLOCK_PHASES 一致）
const QUADRANTS = [
  { phase: '复苏', start: 90, labelAngle: 135 },
  { phase: '过热', start: 0, labelAngle: 45 },
  { phase: '滞胀', start: 270, labelAngle: 315 },
  { phase: '衰退', start: 180, labelAngle: 225 },
]

function angToPhase(angleDeg) {
  let best = '复苏'
  let bestD = 999
  for (const [phase, info] of Object.entries(CLOCK_PHASES)) {
    let d = Math.abs(((angleDeg - info.angle + 540) % 360) - 180)
    d = 180 - d
    if (d < bestD) {
      bestD = d
      best = phase
    }
  }
  return best
}

export default function MerrillClock({ phase, note, onPhase, onNote }) {
  const svgRef = useRef(null)
  const info = CLOCK_PHASES[phase] || CLOCK_PHASES['衰退']
  const pointer = polar(info.angle, 108)
  const pointerDot = polar(info.angle, 118)

  const handleClick = (e) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 340 - CX
    const y = CY - ((e.clientY - rect.top) / rect.height) * 340
    const angle = (Math.atan2(y, x) * 180) / Math.PI
    const p = angToPhase((angle + 360) % 360)
    if (p !== phase) onPhase?.(p)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2.5, alignItems: 'center' }}>
      {/* 时钟 */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <svg
          ref={svgRef}
          viewBox="0 0 340 340"
          width={260}
          height={260}
          onClick={handleClick}
          style={{ cursor: 'pointer', display: 'block' }}
        >
          {/* 象限底色 */}
          {QUADRANTS.map((q) => (
            <path key={q.phase} d={sectorPath(q.start)} fill={CLOCK_PHASES[q.phase].accent} fillOpacity={0.08} stroke={tokens.border} strokeWidth={1} />
          ))}
          {/* 外圈 */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={tokens.border} strokeWidth={1.5} />
          {/* 十字分割线 */}
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke={tokens.border} strokeWidth={1} />
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke={tokens.border} strokeWidth={1} />

          {/* 阶段标签 */}
          {QUADRANTS.map((q) => {
            const lp = polar(q.labelAngle, 92)
            const ph = CLOCK_PHASES[q.phase]
            const active = q.phase === phase
            return (
              <g key={q.phase}>
                <text x={lp.x} y={lp.y - 6} textAnchor="middle" fontSize="15" fontWeight="700" fill={active ? ph.accent : tokens.ink700}>
                  {q.phase}
                </text>
                <text x={lp.x} y={lp.y + 12} textAnchor="middle" fontSize="10.5" fill={tokens.ink500}>
                  {ph.growth}增长 {ph.inflation}通胀
                </text>
                <text x={lp.x} y={lp.y + 26} textAnchor="middle" fontSize="10" fill={ph.accent}>
                  {ph.asset}
                </text>
              </g>
            )
          })}

          {/* 指针 */}
          <line x1={CX} y1={CY} x2={pointer.x} y2={pointer.y} stroke={info.accent} strokeWidth={3} strokeLinecap="round" />
          <circle cx={pointerDot.x} cy={pointerDot.y} r={7} fill={info.accent} stroke="#fff" strokeWidth={2} />
          <circle cx={CX} cy={CY} r={5} fill={tokens.ink900} />

          {/* 轴标题 */}
          <text x={CX} y={CY - R - 8} textAnchor="middle" fontSize="11" fill={tokens.ink500}>增长 ↑</text>
          <text x={CX} y={CY + R + 16} textAnchor="middle" fontSize="11" fill={tokens.ink500}>增长 ↓</text>
          <text x={CX + R + 22} y={CY + 4} textAnchor="middle" fontSize="11" fill={tokens.ink500}>通胀 ↑</text>
          <text x={CX - R - 22} y={CY + 4} textAnchor="middle" fontSize="11" fill={tokens.ink500}>通胀 ↓</text>
        </svg>
      </Box>

      {/* 右侧：当前定位 + 备注 */}
      <Box sx={{ flex: 1, minWidth: 240, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: 1.5, fontSize: 13, fontWeight: 700, color: '#fff', bgcolor: info.accent }}>{phase}</Box>
          <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>当前中国经济定位</Typography>
        </Box>
        <Box sx={{ p: 1.5, mb: 1.5, borderRadius: tokens.radius.md, bgcolor: info.accent, color: '#fff', fontSize: 12.5, lineHeight: 1.6 }}>
          该阶段偏好资产：<b>{info.asset}</b>（增长{info.growth} / 通胀{info.inflation}）
        </Box>
        <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink900, mb: 0.5 }}>研判备注（可编辑）</Typography>
        <TextField
          value={note || ''}
          onChange={(e) => onNote?.(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          size="small"
          placeholder="写下你对当前周期阶段的判断依据…"
          sx={{ '& .MuiInputBase-root': { bgcolor: tokens.bgPage, fontSize: 13 } }}
        />
        <Typography sx={{ fontSize: 11, color: tokens.ink400, mt: 0.75 }}>
          点击时钟任意象限可调整定位；云同步保存。
        </Typography>
      </Box>
    </Box>
  )
}
