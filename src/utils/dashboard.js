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

/**
 * 从交易记录衍生当前持仓（未平仓 = 持有），按标的聚合。
 * @returns {{holdings:Array, totalCNY:number}}
 */
export function deriveHoldings(trades = [], targets = []) {
  const open = trades.filter((t) => t.status !== '已平仓')
  const targetMap = Object.fromEntries((targets || []).map((t) => [t.id, t]))
  const groups = {}
  for (const t of open) {
    const tg = t.targetId ? targetMap[t.targetId] : null
    const key = t.targetId || t.targetName || t.id
    const price = tg?.keyFinancials?.currentPrice ?? t.price
    const fx = FX[t.currency] || 1
    const valueLocal = Number(price || 0) * Number(t.quantity || 0)
    const valueCNY = valueLocal * fx
    const costCNY = Number(t.amount || 0) * fx
    if (!groups[key]) {
      groups[key] = {
        id: t.id,
        name: t.targetName,
        code: tg?.code || '',
        direction: t.direction,
        industry: t.industry || '未分类',
        currency: t.currency,
        targetId: t.targetId,
        quantity: 0,
        price,
        valueCNY: 0,
        costCNY: 0,
        pnlCNY: 0,
        isOutOfBoundary: false,
      }
    }
    const g = groups[key]
    g.quantity += Number(t.quantity || 0)
    g.valueCNY += valueCNY
    g.costCNY += costCNY
    g.pnlCNY += valueCNY - costCNY
    if (t.isOutOfBoundary) g.isOutOfBoundary = true
    // 若后续有更新的 target 价格，以最新价格为准
    if (tg?.keyFinancials?.currentPrice) g.price = tg.keyFinancials.currentPrice
  }
  const rows = Object.values(groups)
  const totalCNY = rows.reduce((s, r) => s + r.valueCNY, 0) || 1
  rows.forEach((r) => {
    r.weight = (r.valueCNY / totalCNY) * 100
  })
  return { holdings: rows, totalCNY }
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
