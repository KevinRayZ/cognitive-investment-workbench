/**
 * 表单 / 闸门 / 仓位硬规则校验。
 * 决策前闸门：5 步全通过方可提交备忘录（硬性阻塞）。
 * 仓位硬规则：单票 ≤ 20%，单一行业 ≤ 40%。
 */

// 5 步闸门标签（顺序固定）
export const GATE_LABELS = ['信息完整', '风险已评估', '红队挑战', '引用原则', '信心阈值']

/**
 * 计算备忘录 5 步闸门通过状态。
 * 1) 信息完整：七要素关键字段非空
 * 2) 风险已评估：risk 非空
 * 3) 红队挑战：redTeamChallenge 非空
 * 4) 引用原则：至少引用 1 条 IS
 * 5) 信心阈值：confidence >= 60
 * @returns {boolean[5]}
 */
export function validateGate(memo) {
  const m = memo || {}
  const infoComplete = Boolean(
    m.targetName && m.direction && m.logic && m.expectedReturn && m.timeFrame && m.catalyst && m.risk,
  )
  const riskIdentified = Boolean(m.risk)
  const redTeam = Boolean(m.redTeamChallenge)
  const references = (m.isIds?.length || 0) >= 1
  const confidence = Number(m.confidence || 0) >= 60
  return [infoComplete, riskIdentified, redTeam, references, confidence]
}

/** 全部闸门通过？ */
export function canSubmitMemo(memo) {
  return validateGate(memo).every(Boolean)
}

/**
 * 仓位硬规则校验。
 * @param {object} trade 当前交易
 * @param {object[]} allTrades 全部交易（用于计算总投资 base 与行业聚合）
 * @returns {{ singlePct:number, industryPct:number, singleBreach:boolean, industryBreach:boolean, base:number }}
 */
export function checkPosition(trade, allTrades = []) {
  const base = allTrades.reduce((s, t) => s + Number(t.amount || 0), 0) || 1
  const singlePct = (Number(trade.amount || 0) / base) * 100
  const industry = trade.industry || '未分类'
  const industrySum = allTrades
    .filter((t) => (t.industry || '未分类') === industry)
    .reduce((s, t) => s + Number(t.amount || 0), 0)
  const industryPct = (industrySum / base) * 100
  return {
    singlePct,
    industryPct,
    singleBreach: singlePct > 20,
    industryBreach: industryPct > 40,
    base,
  }
}

/** 通用非空校验（用于必填字段提示）。 */
export function isFilled(v) {
  return v !== undefined && v !== null && String(v).trim() !== ''
}
