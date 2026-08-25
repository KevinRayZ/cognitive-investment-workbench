import { useRef } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Slider from '@mui/material/Slider'
import tokens, { TONE_COLORS } from '../../theme/tokens'
import { CLOCK_PHASES, PHASE_CYCLE, posToPhase, nextPhase, clampPos, phaseToPos } from '../../utils/dashboard'

// ---- 几何 ----
const VB = 340
const CX = 170
const CY = 170
const R = 145 // 环外半径
const RIN = 56 // 中心枢纽半径
const LABEL_R = 100 // 阶段标签半径
const STEP = 5 // 渐变环分段角度
const SECTORS = 360 / STEP

// 数学角 → SVG 坐标（y 向上为正）
function polar(angleDeg, radius = R) {
  const a = (angleDeg * Math.PI) / 180
  return { x: CX + radius * Math.cos(a), y: CY - radius * Math.sin(a) }
}

// 环形扇区（annular sector）路径
function annularSector(startAngle, endAngle, rInner, rOuter) {
  const p1 = polar(startAngle, rOuter)
  const p2 = polar(endAngle, rOuter)
  const p3 = polar(endAngle, rInner)
  const p4 = polar(startAngle, rInner)
  const large = endAngle - startAngle > 180 ? 1 : 0
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)} L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)} A ${rInner} ${rInner} 0 ${large} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)} Z`
}

// 四阶段中心点角度 + RGB
const PHASE_RGB = {
  复苏: [47, 84, 235],
  过热: [245, 165, 36],
  滞胀: [229, 72, 77],
  衰退: [14, 165, 164],
}

// 角度 → 平滑混色（相邻两阶段按角度线性插值，四区无缝过渡）
function blendAt(a) {
  a = ((a % 360) + 360) % 360
  let seg
  let t
  if (a >= 45 && a < 135) {
    seg = ['过热', '复苏']
    t = (a - 45) / 90
  } else if (a >= 135 && a < 225) {
    seg = ['复苏', '衰退']
    t = (a - 135) / 90
  } else if (a >= 225 && a < 315) {
    seg = ['衰退', '滞胀']
    t = (a - 225) / 90
  } else {
    const aa = a < 45 ? a + 360 : a
    seg = ['滞胀', '过热']
    t = (aa - 315) / 90
  }
  const c1 = PHASE_RGB[seg[0]]
  const c2 = PHASE_RGB[seg[1]]
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
  return `rgb(${r},${g},${b})`
}

// 预生成渐变环分段（颜色静态，只算一次）
const RING = Array.from({ length: SECTORS }, (_, k) => {
  const start = k * STEP
  return { d: annularSector(start, start + STEP, RIN, R), fill: blendAt(start + STEP / 2) }
})

// 周期顺时针轮动方向箭头（屏幕视角：上→右、右→下、下→左、左→上）
const FLOW_HEADS = [
  { at: 90, dir: 'right' }, // 顶：复苏→过热
  { at: 0, dir: 'down' }, // 右：过热→滞胀
  { at: 270, dir: 'left' }, // 底：滞胀→衰退
  { at: 180, dir: 'up' }, // 左：衰退→复苏
]
function arrowHead(angleDeg, dir) {
  const base = polar(angleDeg, R + 2)
  const s = 5
  if (dir === 'right') return `M ${base.x} ${base.y} l -${s} -${s} l 0 ${2 * s} Z`
  if (dir === 'left') return `M ${base.x} ${base.y} l ${s} -${s} l 0 ${2 * s} Z`
  if (dir === 'down') return `M ${base.x} ${base.y} l -${s} -${s} l ${2 * s} 0 Z`
  return `M ${base.x} ${base.y} l -${s} ${s} l ${2 * s} 0 Z` // up
}

const PHASE_LABEL_ANGLE = { 复苏: 135, 过热: 45, 滞胀: 315, 衰退: 225 }

export default function MerrillClock(props) {
  const { pos, note, onPos, onNote } = props
  // 兼容老数据：若未传入连续坐标，用 phase 回退到默认坐标。
  const rawPos = pos && typeof pos.growth === 'number' && typeof pos.inflation === 'number'
    ? pos
    : (phaseToPos(props.phase) || { growth: -12, inflation: -34 })
  const svgRef = useRef(null)
  const dragging = useRef(false)

  const g = clampPos(rawPos.growth)
  const i = clampPos(rawPos.inflation)
  const phase = posToPhase(rawPos)
  const info = CLOCK_PHASES[phase]
  // 指针落点（连续二维坐标）
  const px = CX + (i / 100) * R
  const py = CY - (g / 100) * R
  const setFromEvent = (e) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * VB
    const sy = ((e.clientY - rect.top) / rect.height) * VB
    let ix = (sx - CX) / R
    let gy = (CY - sy) / R
    ix = Math.max(-1, Math.min(1, ix))
    gy = Math.max(-1, Math.min(1, gy))
    onPos?.({ growth: Math.round(gy * 100), inflation: Math.round(ix * 100) })
  }

  const onDown = (e) => {
    dragging.current = true
    try {
      svgRef.current.setPointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
    setFromEvent(e)
  }
  const onMove = (e) => {
    if (dragging.current) setFromEvent(e)
  }
  const onUp = (e) => {
    dragging.current = false
    try {
      svgRef.current.releasePointerCapture(e.pointerId)
    } catch {
      /* noop */
    }
  }

  const transitionTo = nextPhase(phase)
  const cycleFlow = `${PHASE_CYCLE.join(' → ')} → ${PHASE_CYCLE[0]}`

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
      {/* 时钟 */}
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB} ${VB}`}
          width={320}
          height={320}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{ cursor: 'crosshair', display: 'block', touchAction: 'none' }}
        >
          {/* 渐变环（四象限无缝过渡） */}
          {RING.map((s, k) => (
            <path key={k} d={s.d} fill={s.fill} fillOpacity={0.82} stroke="none" />
          ))}
          {/* 中心枢纽 */}
          <circle cx={CX} cy={CY} r={RIN} fill={tokens.surface} stroke={tokens.border} strokeWidth={1} />

          {/* 十字轴（增长/通胀） */}
          <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke={tokens.surface} strokeWidth={1.5} strokeOpacity={0.9} />
          <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke={tokens.surface} strokeWidth={1.5} strokeOpacity={0.9} />

          {/* 阶段标签（带白色描边保证可读） */}
          {Object.keys(CLOCK_PHASES).map((key) => {
            const ang = PHASE_LABEL_ANGLE[key]
            const lp = polar(ang, LABEL_R)
            const ph = CLOCK_PHASES[key]
            const active = key === phase
            return (
              <g key={key}>
                <text
                  x={lp.x}
                  y={lp.y - 7}
                  textAnchor="middle"
                  fontSize={active ? 17 : 14.5}
                  fontWeight={700}
                  fill={active ? ph.accent : tokens.ink700}
                  stroke={tokens.surface}
                  strokeWidth={3}
                  paintOrder="stroke"
                >
                  {key}
                </text>
                <text
                  x={lp.x}
                  y={lp.y + 11}
                  textAnchor="middle"
                  fontSize={11}
                  fill={active ? ph.accent : tokens.ink500}
                  stroke={tokens.surface}
                  strokeWidth={2.5}
                  paintOrder="stroke"
                >
                  {ph.growth}增长 {ph.inflation}通胀
                </text>
                <text
                  x={lp.x}
                  y={lp.y + 25}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill={active ? ph.accent : tokens.ink400}
                  stroke={tokens.surface}
                  strokeWidth={2.5}
                  paintOrder="stroke"
                >
                  {ph.asset}
                </text>
              </g>
            )
          })}

          {/* 周期顺时针轮动箭头（提示过渡方向） */}
          {FLOW_HEADS.map((h, k) => (
            <path key={k} d={arrowHead(h.at, h.dir)} fill={tokens.ink900} fillOpacity={0.28} />
          ))}

          {/* 轴标题 */}
          <text x={CX} y={CY - R - 12} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={tokens.ink700} stroke={tokens.surface} strokeWidth={2.5} paintOrder="stroke">增长 ↑</text>
          <text x={CX} y={CY + R + 18} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={tokens.ink700} stroke={tokens.surface} strokeWidth={2.5} paintOrder="stroke">增长 ↓</text>
          <text x={CX + R + 16} y={CY + 4} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={tokens.ink700} stroke={tokens.surface} strokeWidth={2.5} paintOrder="stroke">通胀 ↑</text>
          <text x={CX - R - 16} y={CY + 4} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={tokens.ink700} stroke={tokens.surface} strokeWidth={2.5} paintOrder="stroke">通胀 ↓</text>

          {/* 指针 + 落点 */}
          <line x1={CX} y1={CY} x2={px} y2={py} stroke={tokens.ink900} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={px} cy={py} r={8} fill={info.accent} stroke={tokens.surface} strokeWidth={2.5} />
          <circle cx={CX} cy={CY} r={5} fill={tokens.ink900} />
        </svg>
      </Box>

      {/* 右侧：定位 + 连续调节 + 备注 */}
      <Box sx={{ flex: 1, minWidth: 250, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.25 }}>
          <Box sx={{ px: 1.5, py: 0.5, borderRadius: tokens.radius.pill, fontSize: 13, fontWeight: 700, color: '#fff', bgcolor: info.accent }}>{phase}</Box>
          <Typography sx={{ fontSize: 13, color: tokens.ink500 }}>当前中国经济定位</Typography>
        </Box>
        <Box sx={{ p: 1.5, mb: 1.5, borderRadius: tokens.radius.md, bgcolor: info.accent, color: '#fff', fontSize: 12.5, lineHeight: 1.6 }}>
          该阶段偏好资产：<b>{info.asset}</b>（增长{info.growth} / 通胀{info.inflation}）
        </Box>

        {/* 连续坐标微调 */}
        <Box sx={{ mb: 1.5, p: 1.5, borderRadius: tokens.radius.md, bgcolor: tokens.bgPage, border: `1px solid ${tokens.border}` }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink700 }}>增长强度</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: g >= 0 ? tokens.up : tokens.down, fontFamily: '"Roboto Mono", monospace' }}>{g > 0 ? '+' : ''}{g}</Typography>
          </Box>
          <Slider
            value={g}
            min={-100}
            max={100}
            size="small"
            onChange={(_, v) => onPos?.({ growth: v, inflation: i })}
            sx={{ color: g >= 0 ? tokens.up : tokens.down, mb: 0.5 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: tokens.ink700 }}>通胀强度</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: i >= 0 ? tokens.warn : tokens.down, fontFamily: '"Roboto Mono", monospace' }}>{i > 0 ? '+' : ''}{i}</Typography>
          </Box>
          <Slider
            value={i}
            min={-100}
            max={100}
            size="small"
            onChange={(_, v) => onPos?.({ growth: g, inflation: v })}
            sx={{ color: i >= 0 ? tokens.warn : tokens.down }}
          />
          <Typography sx={{ fontSize: 11, color: tokens.ink400, mt: 0.5 }}>
            拖拽时钟或拉动滑块即可连续定位；经济在周期中平滑过渡，落点不跳转。
          </Typography>
        </Box>

        {/* 过渡方向提示 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1.25, borderRadius: tokens.radius.md, bgcolor: tokens.primarySoft }}>
          <Box sx={{ fontSize: 15 }}>🔄</Box>
          <Typography sx={{ fontSize: 12.5, color: tokens.ink700, lineHeight: 1.5 }}>
            周期顺时针轮动：<b>{cycleFlow}</b>；当前处于 <b>{phase}</b> 区，正向 <b>{transitionTo}</b> 过渡。
          </Typography>
        </Box>

        {/* 研判备注 */}
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
          点击/拖动时钟任意位置可调整定位；云同步保存。
        </Typography>
      </Box>
    </Box>
  )
}
