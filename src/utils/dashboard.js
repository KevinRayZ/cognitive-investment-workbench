/**
 * 首页看板计算工具：
 * - 大类资产建议仓位区间（评分 + 主观判断 → 区间）
 * - 持仓衍生（市值 / 权重，跨币种近似折算）
 * - 持仓健康检查（对照《总纲》硬约束）
 *
 * 汇率近似（仅用于跨币种权重估算，非交易级精度）：
 *   USD ≈ 7.23 CNY，HKD ≈ 0.92 CNY
 */

export const FX = { CNY: 1, HKD: 0.92, USD: 7.23 }

// 各类资产建议仓位上限（占组合百分比），与《总纲》大类配置思路一致
export const ASSET_CAP = {
  equity: 55,
  hkequity: 40,
  usequity: 30,
  bond: 40,
  gold: 25,
  commodity: 20,
  cash: 30,
}

// 主观判断对中心仓位的偏移
const VIEW_OFFSET = { 乐观: 8, 中性: 0, 谨慎: -8 }

/**
 * 由客观评分(0-100)与主观判断，计算建议仓位区间 [low, high]（占组合 %）。
 * @param {{id:string, score:number, view:string}} asset
 */
export function suggestedRange(asset) {
  const cap = ASSET_CAP[asset.id] || 30
  const offset = VIEW_OFFSET[asset.view] ?? 0
  const center = Math.max(0, Math.min(cap, Math.round((Number(asset.score) / 100) * cap) + offset))
  const spread = 6
  const low = Math.max(0, center - spread)
  const high = Math.min(cap, center + spread)
  return { cap, center, low, high }
}

/** 梅林时钟四阶段 → 偏好资产与指针角度（数学角，0°=正右，CCW；复苏=左上135/过热=右上45/滞胀=右下315/衰退=左下225）。 */
export const CLOCK_PHASES = {
  复苏: { growth: '↑', inflation: '↓', asset: '股票（权益）', angle: 135, accent: '#2F54EB' },
  过热: { growth: '↑', inflation: '↑', asset: '商品', angle: 45, accent: '#F5A524' },
  滞胀: { growth: '↓', inflation: '↑', asset: '现金 / 货币', angle: 315, accent: '#E5484D' },
  衰退: { growth: '↓', inflation: '↓', asset: '债券 + 黄金', angle: 225, accent: '#0EA5A4' },
}

/** 顺时针轮动顺序（屏幕视角）：衰退→复苏→过热→滞胀→衰退。 */
export const PHASE_CYCLE = ['衰退', '复苏', '过热', '滞胀']

/** 连续坐标 pos = { growth:-100~100, inflation:-100~100 } → 最近阶段。 */
export function posToPhase(pos = { growth: 0, inflation: 0 }) {
  const g = Number(pos.growth) || 0
  const i = Number(pos.inflation) || 0
  if (g >= 0 && i < 0) return '复苏'
  if (g >= 0 && i >= 0) return '过热'
  if (g < 0 && i >= 0) return '滞胀'
  return '衰退'
}

/** 连续坐标 → 数学角（度，0~360），用于标签/过渡判断。 */
export function posToAngle(pos = { growth: 0, inflation: 0 }) {
  const g = Number(pos.growth) || 0
  const i = Number(pos.inflation) || 0
  const a = (Math.atan2(g, i) * 180) / Math.PI
  return ((a % 360) + 360) % 360
}

/** 将值限幅到 -100~100（梅林时钟坐标范围）。 */
export function clampPos(v) {
  return Math.max(-100, Math.min(100, Number(v) || 0))
}

/** 周期中下一阶段（用于「过渡方向」提示）。 */
export function nextPhase(phase) {
  const idx = PHASE_CYCLE.indexOf(phase)
  return PHASE_CYCLE[(idx + 1) % PHASE_CYCLE.length]
}

/** 阶段 → 默认连续坐标（象限内偏中心；衰退用贴近复苏边界的实际研判点）。 */
export function phaseToPos(phase) {
  const map = {
    复苏: { growth: 35, inflation: -35 },
    过热: { growth: 35, inflation: 35 },
    滞胀: { growth: -35, inflation: 35 },
    衰退: { growth: -12, inflation: -34 },
  }
  return map[phase] || { growth: -12, inflation: -34 }
}

/**
 * 从交易记录衍生当前持仓（未平仓 = 持有），按标的聚合。
 * @param {Array} trades
 * @param {Array} targets
 * @param {object} [opts]
 *   - quotes: { [code]: {price, name?, changePct?} } 实时行情快照（CASH 无行情，走静态路径）
 *   - sharesMap: { [key]: shares } 已缓存的实时份额（按最新价折算市值用）
 *   - onShares: (key, shares) => void 首次由静态市值推导出份额时回调（用于持久化）
 *   - cashKeys: 现金类 targetId 列表外的代码可带行情；现金始终静态
 * @returns {{holdings:Array, totalCNY:number}}
 */
export function deriveHoldings(trades = [], targets = [], opts = {}) {
  const { quotes = {}, sharesMap = {}, onShares } = opts
  const open = trades.filter((t) => t.status !== '已平仓')
  const targetMap = Object.fromEntries((targets || []).map((t) => [t.id, t]))
  const groups = {}
  for (const t of open) {
    const tg = t.targetId ? targetMap[t.targetId] : null
    const key = t.targetId || t.targetName || t.id
    const staticPrice = tg?.keyFinancials?.currentPrice ?? t.price
    if (!groups[key]) {
      groups[key] = {
        id: t.id,
        name: t.targetName || tg?.name || '',
        code: tg?.code || '',
        direction: t.direction,
        industry: t.industry || '未分类',
        currency: t.currency,
        targetId: t.targetId,
        quantity: 0,
        price: staticPrice,
        valueCNY: 0,
        costCNY: 0,
        pnlCNY: 0,
        isOutOfBoundary: false,
        liveQuote: null,
        shares: 0,
      }
    }
    const g = groups[key]
    g.quantity += Number(t.quantity || 0)
    const fx = FX[t.currency] || 1
    g.costCNY += Number(t.amount || 0) * fx
    // 未启用实时价时的静态市值
    g.valueCNY += Number(staticPrice || 0) * Number(t.quantity || 0) * fx
    if (t.isOutOfBoundary) g.isOutOfBoundary = true
    if (tg?.keyFinancials?.currentPrice) g.price = tg.keyFinancials.currentPrice
  }

  const rows = Object.values(groups)

  // 实时行情 → 动态折算：首次以「用户给定市值 ÷ 当前价」锁定份额，此后市值随价格浮动
  for (const r of rows) {
    const q = r.code ? quotes[r.code] : null
    const price = q && Number.isFinite(Number(q.price)) && Number(q.price) > 0 ? Number(q.price) : null
    const isCash = !r.code || /^cash$/i.test(r.code)
    if (!isCash && price) {
      let shares = Number(sharesMap[r.targetId || r.code])
      if (!Number.isFinite(shares) || shares <= 0) {
        // 用静态基准值换算份额（本地币种）
        const baseLocal = r.valueCNY / (FX[r.currency] || 1)
        shares = baseLocal / price
        if (Number.isFinite(shares) && shares > 0 && onShares) {
          try { onShares(r.targetId || r.code, shares) } catch (_) {}
        }
      }
      r.shares = shares
      r.liveQuote = q
      r.price = price
      r.liveName = q.name || ''
      // 本地名称缺失或只有代码时，才用行情接口返回的名称补充，避免英文行情名覆盖中文名
      if ((!r.name || r.name === r.code) && q.name) r.name = q.name
      r.changePct = Number.isFinite(Number(q.changePct)) ? Number(q.changePct) : null
      r.valueCNY = shares * price * (FX[r.currency] || 1)
    } else {
      r.shares = r.quantity // 静态路径：quantity 即仓位表示
    }
    r.pnlCNY = r.valueCNY - r.costCNY
  }

  const totalCNY = rows.reduce((s, r) => s + r.valueCNY, 0) || 1
  rows.forEach((r) => {
    r.weight = (r.valueCNY / totalCNY) * 100
  })
  return { holdings: rows, totalCNY }
}

/**
 * 方向建议：结合权重纪律、AI 吸引力评分、边界外标记给出针对性方向。
 * @param {{weight:number,isOutOfBoundary:boolean,name:string}} h
 * @param {{attractiveness?:number, blocked?:boolean}} [ai]
 * @returns {{label:string, tone:'up'|'hold'|'warn'|'error'}}
 */
export function suggestAction(h, ai = {}) {
  if (h.isOutOfBoundary) return { label: '人工复核', tone: 'warn' }
  if (ai.blocked) return { label: '合规规避', tone: 'error' }
  if (h.weight > 20) return { label: '减持·超上限', tone: 'warn' }
  if (h.weight > 15) return { label: '控制集中度', tone: 'warn' }
  const a = ai.attractiveness
  if (typeof a === 'number') {
    if (a >= 66) return { label: '逢低增持', tone: 'up' }
    if (a >= 40) return { label: '持有', tone: 'hold' }
    return { label: '观望·吸引力低', tone: 'warn' }
  }
  return { label: '持有', tone: 'hold' }
}

/**
 * 持仓健康检查（对照《总纲》硬约束）。
 * 单票 ≤ 15%（预警）/ ≤ 20%（超限）；行业 ≤ 30%（预警）/ ≤ 40%（超限）。
 * @returns {{issues:Array, singleMax:number, industryMax:number, boundaryCount:number}}
 */
export function checkHealth(holdings = []) {
  const issues = []
  let singleMax = 0
  let boundaryCount = 0

  for (const h of holdings) {
    singleMax = Math.max(singleMax, h.weight)
    if (h.weight > 20) {
      issues.push({ level: 'breach', text: `单票「${h.name}」占比 ${h.weight.toFixed(1)}% 超过 20% 硬上限` })
    } else if (h.weight > 15) {
      issues.push({ level: 'warn', text: `单票「${h.name}」占比 ${h.weight.toFixed(1)}% 超过 15% 权益上限` })
    }
    if (h.isOutOfBoundary) {
      boundaryCount += 1
      issues.push({ level: 'breach', text: `「${h.name}」为边界外交易，须人工复核后方可解除` })
    }
  }

  const byIndustry = {}
  for (const h of holdings) byIndustry[h.industry] = (byIndustry[h.industry] || 0) + h.weight
  let industryMax = 0
  for (const [ind, w] of Object.entries(byIndustry)) {
    industryMax = Math.max(industryMax, w)
    if (w > 40) {
      issues.push({ level: 'breach', text: `行业「${ind}」合计 ${w.toFixed(1)}% 超过 40% 上限` })
    } else if (w > 30) {
      issues.push({ level: 'warn', text: `行业「${ind}」合计 ${w.toFixed(1)}% 超过 30% 上限` })
    }
  }

  // 按严重度排序：超限优先
  issues.sort((a, b) => (a.level === b.level ? 0 : a.level === 'breach' ? -1 : 1))
  return { issues, singleMax, industryMax, boundaryCount }
}

export const HARD_RULES = [
  '资金周期 2 年',
  '最大回撤 ≤ 30%',
  '单票 15/10/5%',
  '行业 ≤ 30%',
  '逆向总仓 ≤ 15%',
]
